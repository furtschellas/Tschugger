"""Encrypt the crew data for the public website.
usage: CREW_KEY=<base64 32-byte key> python3 tools/publish.py <dump_dir>
<dump_dir> holds one folder per collection (days, crew, locations, places, dispos, meta) with <doc_id>.json files,
as written by ArtifactData list/get with out_dir. Writes data.enc.json only if the content changed.
The same key is stored in Firestore (secret/key) and handed only to signed-in, enabled crew members."""
import sys,os,json,glob,hashlib,base64,pathlib,secrets,datetime
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
R=pathlib.Path(__file__).resolve().parent.parent
dump=pathlib.Path(sys.argv[1]);k=os.environ.get("CREW_KEY") or sys.exit("CREW_KEY missing")
key=base64.b64decode(k);assert len(key)==32,"CREW_KEY must be 32 bytes"
def coll(name):
  out=[]
  for f in sorted(glob.glob(str(dump/name/"*.json"))):
    d=json.load(open(f));d.pop("version",None);d["id"]=pathlib.Path(f).stem;out.append(d)
  return out
meta=next((m for m in coll("meta") if m["id"]=="info"),None)
if meta:meta.pop("id",None)
data={"meta":meta,"days":coll("days"),"crew":coll("crew"),"locations":coll("locations"),"places":coll("places"),"dispos":coll("dispos")}
if not data["days"] or not data["crew"]:sys.exit("refusing to publish: days or crew empty")
pt=json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()
stamp=hashlib.sha256(key+pt).hexdigest()[:16]
dst=R/"data.enc.json"
if dst.exists():
  try:
    if json.load(open(dst)).get("stamp")==stamp:print("unchanged",stamp);sys.exit(0)
  except Exception:pass
iv=secrets.token_bytes(12);ct=AESGCM(key).encrypt(iv,pt,None)
json.dump({"v":2,"stamp":stamp,"iv":base64.b64encode(iv).decode(),"ct":base64.b64encode(ct).decode(),
  "builtAt":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")},open(dst,"w"))
print("written",stamp,len(ct))
