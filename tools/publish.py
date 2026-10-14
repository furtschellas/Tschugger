"""Encrypt the crew data for the public website.
usage: CREW_PW=... python3 tools/publish.py <dump_dir>
<dump_dir> holds one folder per collection (days, crew, locations, places, dispos, meta) with <doc_id>.json files,
as written by ArtifactData list/get with out_dir. Writes data.enc.json only if the content changed."""
import sys,os,json,glob,hashlib,base64,pathlib,secrets,datetime
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
T=pathlib.Path(__file__).resolve().parent;R=T.parent
dump=pathlib.Path(sys.argv[1]);pw=os.environ.get("CREW_PW") or sys.exit("CREW_PW missing")
def coll(name):
  out=[]
  for f in sorted(glob.glob(str(dump/name/"*.json"))):
    d=json.load(open(f));d.pop("version",None);d["id"]=pathlib.Path(f).stem;out.append(d)
  return out
meta=coll("meta");meta=next((m for m in meta if m["id"]=="info"),None)
if meta:meta.pop("id",None)
data={"meta":meta,"days":coll("days"),"crew":coll("crew"),"locations":coll("locations"),"places":coll("places"),"dispos":coll("dispos")}
if not data["days"] or not data["crew"]:sys.exit("refusing to publish: days or crew empty")
pt=json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()
stamp=hashlib.sha256(pt).hexdigest()[:16]
dst=R/"data.enc.json"
if dst.exists():
  try:
    if json.load(open(dst)).get("stamp")==stamp:print("unchanged",stamp);sys.exit(0)
  except Exception:pass
salt=(T/"salt.txt").read_text().strip();it=250000
key=PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=base64.b64decode(salt),iterations=it).derive(pw.encode())
iv=secrets.token_bytes(12);ct=AESGCM(key).encrypt(iv,pt,None)
json.dump({"v":1,"stamp":stamp,"salt":salt,"iter":it,"iv":base64.b64encode(iv).decode(),"ct":base64.b64encode(ct).decode(),
  "builtAt":datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")},open(dst,"w"))
print("written",stamp,len(ct))
