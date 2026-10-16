/* ---------- web boot (GitHub Pages): Firebase sign-in + encrypted data file ---------- */
const FB_CONFIG={apiKey:"AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ",authDomain:"tschugger-83692.firebaseapp.com",projectId:"tschugger-83692",storageBucket:"tschugger-83692.firebasestorage.app",messagingSenderId:"786764568575",appId:"1:786764568575:web:552eeefa77c44f5d24b9ca"};
const FB_V="10.12.2",ADMINS=["furtschellas@gmail.com"],DATA_URL="data.enc.json",POLL_MS=3*60*1000;
Object.assign(I18N,{
 "Anmelden":{it:"Accedi",fr:"Se connecter",en:"Sign in"},
 "E-Mail":{it:"E-mail",fr:"E-mail",en:"Email"},
 "Passwort":{it:"Password",fr:"Mot de passe",en:"Password"},
 "Passwort wiederholen":{it:"Ripeti la password",fr:"Répéter le mot de passe",en:"Repeat password"},
 "Neues Passwort":{it:"Nuova password",fr:"Nouveau mot de passe",en:"New password"},
 "Aktuelles Passwort":{it:"Password attuale",fr:"Mot de passe actuel",en:"Current password"},
 "Neue E-Mail-Adresse":{it:"Nuovo indirizzo e-mail",fr:"Nouvelle adresse e-mail",en:"New email address"},
 "Konto erstellen":{it:"Crea account",fr:"Créer un compte",en:"Create account"},
 "Erstes Mal hier? Konto erstellen":{it:"Prima volta qui? Crea un account",fr:"Première fois ? Créer un compte",en:"First time here? Create an account"},
 "Schon ein Konto? Anmelden":{it:"Hai già un account? Accedi",fr:"Déjà un compte ? Se connecter",en:"Already have an account? Sign in"},
 "Passwort vergessen?":{it:"Password dimenticata?",fr:"Mot de passe oublié ?",en:"Forgot password?"},
 "Link zum Zurücksetzen senden":{it:"Invia link per reimpostare",fr:"Envoyer le lien de réinitialisation",en:"Send reset link"},
 "Zurück":{it:"Indietro",fr:"Retour",en:"Back"},
 "Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die du der Produktion angegeben hast.":{it:"Solo per la crew di TSCHUGGER Tigerblood. Accedi con l’indirizzo e-mail che hai dato alla produzione.",fr:"Réservé à l’équipe de TSCHUGGER Tigerblood. Connecte-toi avec l’adresse e-mail que tu as donnée à la production.",en:"For the TSCHUGGER Tigerblood crew only. Sign in with the email address you gave the production."},
 "Mindestens 8 Zeichen.":{it:"Almeno 8 caratteri.",fr:"Au moins 8 caractères.",en:"At least 8 characters."},
 "Die Passwörter stimmen nicht überein.":{it:"Le password non coincidono.",fr:"Les mots de passe ne correspondent pas.",en:"The passwords don’t match."},
 "E-Mail oder Passwort falsch.":{it:"E-mail o password errata.",fr:"E-mail ou mot de passe incorrect.",en:"Wrong email or password."},
 "Für diese Adresse gibt es schon ein Konto. Bitte anmelden.":{it:"Esiste già un account per questo indirizzo. Accedi.",fr:"Un compte existe déjà pour cette adresse. Connecte-toi.",en:"There is already an account for this address. Please sign in."},
 "Ungültige E-Mail-Adresse.":{it:"Indirizzo e-mail non valido.",fr:"Adresse e-mail invalide.",en:"Invalid email address."},
 "Zu viele Versuche. Bitte kurz warten.":{it:"Troppi tentativi. Attendi un momento.",fr:"Trop de tentatives. Patiente un instant.",en:"Too many attempts. Please wait a moment."},
 "Bitte bestätige zuerst deine E-Mail-Adresse.":{it:"Conferma prima il tuo indirizzo e-mail.",fr:"Confirme d’abord ton adresse e-mail.",en:"Please confirm your email address first."},
 "Wir haben dir eine Mail mit einem Bestätigungslink geschickt. Tippe auf den Link und komm dann hierher zurück.":{it:"Ti abbiamo inviato un’e-mail con un link di conferma. Tocca il link e poi torna qui.",fr:"Nous t’avons envoyé un e-mail avec un lien de confirmation. Touche le lien puis reviens ici.",en:"We sent you an email with a confirmation link. Tap the link, then come back here."},
 "Ich habe bestätigt":{it:"Ho confermato",fr:"J’ai confirmé",en:"I’ve confirmed"},
 "Mail nochmals senden":{it:"Invia di nuovo l’e-mail",fr:"Renvoyer l’e-mail",en:"Send the email again"},
 "Mail gesendet.":{it:"E-mail inviata.",fr:"E-mail envoyé.",en:"Email sent."},
 "Noch nicht bestätigt. Schau auch im Spam-Ordner nach.":{it:"Non ancora confermato. Controlla anche lo spam.",fr:"Pas encore confirmé. Regarde aussi dans les spams.",en:"Not confirmed yet. Also check your spam folder."},
 "Wenn es für diese Adresse ein Konto gibt, kommt gleich eine Mail zum Zurücksetzen.":{it:"Se esiste un account per questo indirizzo, riceverai a breve un’e-mail per reimpostare.",fr:"S’il existe un compte pour cette adresse, un e-mail de réinitialisation arrive.",en:"If there is an account for this address, a reset email is on its way."},
 "Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die auf der Crewliste steht – diese ist bereits freigeschaltet.":{fr:"Réservé à l’équipe de TSCHUGGER Tigerblood. Connecte-toi avec l’adresse e-mail qui figure sur la liste de l’équipe – elle est déjà autorisée.",it:"Solo per la crew di TSCHUGGER Tigerblood. Accedi con l’indirizzo e-mail che figura nella lista crew – è già autorizzato.",en:"For the TSCHUGGER Tigerblood crew only. Sign in with the email address on the crew list – it is already authorised."},
 "Diese E-Mail-Adresse ist nicht für die Crew-App freigeschaltet.":{fr:"Cette adresse e-mail n’est pas autorisée pour l’app de l’équipe.",it:"Questo indirizzo e-mail non è autorizzato per l’app della crew.",en:"This email address is not authorised for the crew app."},
 "Bitte melde dich ab und wieder an – mit der E-Mail-Adresse, die auf der Crewliste steht. Diese ist bereits freigeschaltet. Bei Google: das Google-Konto mit dieser Adresse wählen. Stimmt die Adresse auf der Crewliste nicht, melde dich bei der Produktion.":{fr:"Déconnecte-toi puis reconnecte-toi avec l’adresse e-mail qui figure sur la liste de l’équipe. Elle est déjà autorisée. Avec Google : choisis le compte Google qui a cette adresse. Si l’adresse sur la liste n’est pas correcte, contacte la production.",it:"Esci e accedi di nuovo con l’indirizzo e-mail che figura nella lista crew. È già autorizzato. Con Google: scegli l’account Google con questo indirizzo. Se l’indirizzo nella lista non è corretto, contatta la produzione.",en:"Please sign out and sign in again with the email address on the crew list. It is already authorised. With Google: choose the Google account with that address. If the address on the crew list is wrong, contact the production."},
 "Abmelden und mit Crewliste-Adresse anmelden":{fr:"Se déconnecter et utiliser l’adresse de la liste",it:"Esci e accedi con l’indirizzo della lista",en:"Sign out and use the crew-list address"},
 "Zugang bei der Produktion anfragen":{fr:"Demander l’accès à la production",it:"Chiedi l’accesso alla produzione",en:"Request access from the production"},
 "Vor- und Nachname":{fr:"Prénom et nom",it:"Nome e cognome",en:"First and last name"},
 "Funktion / Department":{fr:"Fonction / département",it:"Funzione / reparto",en:"Job / department"},
 "Nachricht (optional)":{fr:"Message (facultatif)",it:"Messaggio (facoltativo)",en:"Message (optional)"},
 "Anfrage senden":{fr:"Envoyer la demande",it:"Invia richiesta",en:"Send request"},
 "Bitte Vor- und Nachname angeben.":{fr:"Indique ton prénom et ton nom.",it:"Indica nome e cognome.",en:"Please enter your first and last name."},
 "Anfrage gesendet. Du bekommst Zugang, sobald die Produktion sie freigibt – du erhältst dann eine E-Mail, oder tippe hier auf «Aktualisieren».":{fr:"Demande envoyée. Tu auras accès dès que la production l’aura validée – tu recevras alors un e-mail, ou touche « Actualiser » ici.",it:"Richiesta inviata. Avrai accesso appena la produzione la approva – riceverai un’e-mail, oppure tocca «Aggiorna» qui.",en:"Request sent. You get access as soon as the production approves it – you will get an e-mail, or tap “Refresh” here."},
 "Anfragen von Benutzer:innen":{fr:"Demandes d’utilisateurs",it:"Richieste utenti",en:"User requests"},
 "Keine offenen Anfragen.":{fr:"Aucune demande en attente.",it:"Nessuna richiesta in sospeso.",en:"No open requests."},
 "Anfragen nicht lesbar":{fr:"Demandes illisibles",it:"Richieste non leggibili",en:"Requests not readable"},
 "Mail wird gesendet …":{fr:"Envoi du mail …",it:"Invio della mail …",en:"Sending mail …"},
 "Mail gesendet um":{fr:"Mail envoyé à",it:"Mail inviata alle",en:"Mail sent at"},
 "Zu viele Versuche – bitte in ein paar Minuten nochmals.":{fr:"Trop de tentatives – réessaie dans quelques minutes.",it:"Troppi tentativi – riprova tra qualche minuto.",en:"Too many attempts – please try again in a few minutes."},
 "Gmail-Adresse? Dann geht es ohne Bestätigungs-Mail:":{fr:"Adresse Gmail ? Alors sans mail de confirmation :",it:"Indirizzo Gmail? Allora senza mail di conferma:",en:"Gmail address? Then no confirmation mail is needed:"},
 "Absender: noreply@tschugger-83692.firebaseapp.com – bitte auch im Spam- bzw. Junk-Ordner nachsehen und die Mail als «Kein Spam» markieren.":{fr:"Expéditeur : noreply@tschugger-83692.firebaseapp.com – regarde aussi dans les spams et marque le mail comme « non spam ».",it:"Mittente: noreply@tschugger-83692.firebaseapp.com – controlla anche lo spam e segna la mail come «non spam».",en:"Sender: noreply@tschugger-83692.firebaseapp.com – please also check your spam/junk folder and mark the mail as “not spam”."},
 "Automatische Aktualisierung (Dropbox → Webseite)":{fr:"Mise à jour automatique (Dropbox → site)",it:"Aggiornamento automatico (Dropbox → sito)",en:"Automatic update (Dropbox → website)"},
 "Läuft":{fr:"Actif",it:"Attivo",en:"Running"},
 "zuletzt geprüft":{fr:"dernier contrôle",it:"ultimo controllo",en:"last checked"},
 "Daten vom":{fr:"données du",it:"dati del",en:"data from"},
 "In den App-Einstellungen ausgeschaltet":{fr:"Désactivée dans les réglages de l’app",it:"Disattivato nelle impostazioni dell’app",en:"Switched off in the app settings"},
 "Fehler beim letzten Lauf":{fr:"Erreur lors du dernier passage",it:"Errore nell’ultima esecuzione",en:"Error in the last run"},
 "Noch nicht eingerichtet":{fr:"Pas encore configurée",it:"Non ancora configurato",en:"Not set up yet"},
 "es fehlen":{fr:"il manque",it:"mancano",en:"missing"},
 "Lade …":{fr:"Chargement …",it:"Caricamento …",en:"Loading …"},
 "GitHub liest die Dropbox zweimal pro Stunde (nur lesend), wandelt neue Drehpläne, Crewlisten, Dispos und das Drehbuch um und veröffentlicht sie verschlüsselt auf der Webseite – ohne dass ein Computer laufen muss.":{fr:"GitHub lit la Dropbox deux fois par heure (lecture seule), convertit les nouveaux plans de tournage, listes d’équipe, feuilles de service et le scénario et les publie chiffrés sur le site – sans qu’un ordinateur doive tourner.",it:"GitHub legge la Dropbox due volte all’ora (solo lettura), converte nuovi piani di lavorazione, liste crew, ordini del giorno e la sceneggiatura e li pubblica criptati sul sito – senza che un computer debba essere acceso.",en:"GitHub reads the Dropbox twice an hour (read-only), converts new schedules, crew lists, call sheets and the script and publishes them encrypted on the website – no computer needs to be running."},
 "Dropbox-Zugang (nur lesend) erzeugen:":{fr:"Créer l’accès Dropbox (lecture seule) :",it:"Creare l’accesso Dropbox (solo lettura):",en:"Create the Dropbox access (read-only):"},
 "Claude-API-Schlüssel erstellen:":{fr:"Créer la clé API Claude :",it:"Creare la chiave API Claude:",en:"Create the Claude API key:"},
 "den Schlüssel der Crew-Daten bekommst du von Claude im Chat.":{fr:"la clé des données d’équipe, tu la reçois de Claude dans le chat.",it:"la chiave dei dati crew te la dà Claude nella chat.",en:"you get the crew data key from Claude in the chat."},
 "Alle vier in GitHub eintragen:":{fr:"Saisir les quatre dans GitHub :",it:"Inserire tutte e quattro in GitHub:",en:"Enter all four in GitHub:"},
 "Ersten Lauf starten:":{fr:"Lancer le premier passage :",it:"Avviare la prima esecuzione:",en:"Start the first run:"},
 "Läufe auf GitHub ansehen":{fr:"Voir les passages sur GitHub",it:"Vedi le esecuzioni su GitHub",en:"See the runs on GitHub"},
 "Als Benutzer:in einladen":{fr:"Inviter comme utilisateur",it:"Invita come utente",en:"Invite as user"},
 "ist jetzt als Benutzer:in freigeschaltet und kann ein Konto erstellen.":{fr:"est maintenant autorisé et peut créer un compte.",it:"è ora abilitato e può creare un account.",en:"is now approved and can create an account."},
 "Einladungs-Mail schicken":{fr:"Envoyer l’invitation",it:"Invia l’invito",en:"Send invitation mail"},
 "Dein Zugang zur TSCHUGGER Crew-App":{fr:"Ton accès à l’app d’équipe TSCHUGGER",it:"Il tuo accesso all’app crew TSCHUGGER",en:"Your access to the TSCHUGGER crew app"},
 "du bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet. Dort findest du Drehplan, Dispos, Crewliste, Locations und das Drehbuch.":{fr:"tu as accès à l’app d’équipe de TSCHUGGER Tigerblood. Tu y trouves le plan de tournage, les feuilles de service, la liste d’équipe, les lieux et le scénario.",it:"sei abilitato all’app crew di TSCHUGGER Tigerblood. Lì trovi piano di lavorazione, ordini del giorno, lista crew, location e sceneggiatura.",en:"you now have access to the TSCHUGGER Tigerblood crew app. It has the schedule, call sheets, crew list, locations and the script."},
 "So geht's:":{fr:"Comment faire :",it:"Come fare:",en:"How it works:"},
 "«Konto erstellen» mit genau dieser E-Mail-Adresse:":{fr:"« Créer un compte » avec exactement cette adresse :",it:"«Crea account» con esattamente questo indirizzo:",en:"“Create account” with exactly this e-mail address:"},
 "(Gmail-Adresse: einfach «Mit Google anmelden»)":{fr:"(adresse Gmail : simplement « Se connecter avec Google »)",it:"(indirizzo Gmail: semplicemente «Accedi con Google»)",en:"(Gmail address: simply “Sign in with Google”)"},
 "Bestätigungs-Mail öffnen und auf den Link tippen – bitte auch im Spam-Ordner nachsehen.":{fr:"Ouvrir le mail de confirmation et toucher le lien – regarde aussi dans les spams.",it:"Apri la mail di conferma e tocca il link – controlla anche lo spam.",en:"Open the confirmation mail and tap the link – please also check your spam folder."},
 "Gespeichert.":{fr:"Enregistré.",it:"Salvato.",en:"Saved."},
 "Passwort-Link senden":{fr:"Envoyer un lien de mot de passe",it:"Invia link password",en:"Send password link"},
 "Startpasswort erzeugen":{fr:"Créer un mot de passe initial",it:"Crea password iniziale",en:"Create start password"},
 "Anzeigen":{fr:"Afficher",it:"Mostra",en:"Show"},
 "Keine Berechtigung – bitte die neuen Firestore-Regeln in Firebase veröffentlichen.":{fr:"Pas d’autorisation – publie les nouvelles règles Firestore dans Firebase.",it:"Nessuna autorizzazione – pubblica le nuove regole Firestore in Firebase.",en:"No permission – please publish the new Firestore rules in Firebase."},
 "Ohne Bestätigungs-Mail freischalten":{fr:"Autoriser sans mail de confirmation",it:"Abilita senza mail di conferma",en:"Approve without confirmation mail"},
 "{e} ohne Bestätigungs-Mail freischalten? Nur machen, wenn die Adresse sicher dieser Person gehört.":{fr:"Autoriser {e} sans mail de confirmation ? Seulement si l’adresse appartient bien à cette personne.",it:"Abilitare {e} senza mail di conferma? Solo se l’indirizzo appartiene sicuramente a questa persona.",en:"Approve {e} without a confirmation mail? Only do this if the address surely belongs to this person."},
 "ist freigeschaltet. Die Person meldet sich einfach an – oder tippt auf «Ich habe bestätigt».":{fr:"est autorisé. La personne se connecte simplement – ou touche « J’ai confirmé ».",it:"è abilitato. La persona accede semplicemente – oppure tocca «Ho confermato».",en:"is approved. The person simply signs in – or taps “I have confirmed”."},
 "Benutzerdaten bearbeiten":{fr:"Modifier les données utilisateur",it:"Modifica dati utente",en:"Edit user data"},
 "Alle":{fr:"Tous",it:"Tutti",en:"All"},
 "Aktiv":{fr:"Actifs",it:"Attivi",en:"Active"},
 "Eingeladen":{fr:"Invités",it:"Invitati",en:"Invited"},
 "Mit Rolle":{fr:"Avec rôle",it:"Con ruolo",en:"With role"},
 "Aktionen":{fr:"Actions",it:"Azioni",en:"Actions"},
 "Keine Treffer.":{fr:"Aucun résultat.",it:"Nessun risultato.",en:"No matches."},
 "Name, E-Mail oder Funktion suchen":{fr:"Chercher nom, e-mail ou fonction",it:"Cerca nome, e-mail o funzione",en:"Search name, email or role"},
 "Daten jetzt aktualisieren":{fr:"Actualiser les données",it:"Aggiorna i dati ora",en:"Refresh data now"},
 "Vorproduktion (Prep) sehen":{fr:"Voir la préproduction (prep)",it:"Vedere la preproduzione (prep)",en:"See pre-production (prep)"},
 "Drehplan sehen":{fr:"Voir le plan de tournage",it:"Vedere il piano di lavorazione",en:"See schedule"},
 "Callsheet sehen":{fr:"Voir la callsheet",it:"Vedere il callsheet",en:"See call sheet"},
 "Kontakte (Telefon, E-Mail) sehen":{fr:"Voir les contacts (téléphone, e-mail)",it:"Vedere i contatti (telefono, e-mail)",en:"See contacts (phone, email)"},
 "Meine Termine sehen":{fr:"Voir mes rendez-vous",it:"Vedere i miei appuntamenti",en:"See my appointments"},
 "Crewliste sehen":{fr:"Voir la liste de l'équipe",it:"Vedere la lista crew",en:"See crew list"},
 "Drehbuch (Script) sehen":{fr:"Voir le scénario (script)",it:"Vedere la sceneggiatura (script)",en:"See script"},
 "Telefon und E-Mail von Personen ausserhalb der Crewliste sehen":{fr:"Voir téléphone et e-mail des personnes hors liste d'équipe",it:"Vedere telefono ed e-mail di persone fuori dalla lista crew",en:"See phone and email of people not on the crew list"},
 "Zugangsanfragen freischalten":{fr:"Approuver les demandes d'accès",it:"Approvare le richieste di accesso",en:"Approve access requests"},
 "Berechtigung":{fr:"droit",it:"permesso",en:"permission"},
 "Berechtigungen":{fr:"droits",it:"permessi",en:"permissions"},
 "Keine Berechtigungen":{fr:"Aucun droit",it:"Nessun permesso",en:"No permissions"},
 "Standard wiederherstellen":{fr:"Rétablir par défaut",it:"Ripristina predefinito",en:"Restore default"},
 "Abbrechen":{fr:"Annuler",it:"Annulla",en:"Cancel"},
 "Geschlecht":{fr:"Genre",it:"Genere",en:"Gender"},
 "bitte wählen":{fr:"choisir",it:"scegli",en:"please choose"},
 "Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln).":{fr:"Pas d'autorisation – publie d'abord les nouvelles règles Firestore (console Firebase → Firestore → Règles).",it:"Nessuna autorizzazione – pubblica prima le nuove regole Firestore (console Firebase → Firestore → Regole).",en:"No permission – please publish the new Firestore rules first (Firebase console → Firestore → Rules)."},
 "Bitte ausfüllen:":{fr:"À remplir :",it:"Da compilare:",en:"Please fill in:"},
 "Profil gespeichert. Geschlecht, Telefon und E-Mail konnten noch nicht gespeichert werden – die Produktion muss die neuen App-Regeln aktivieren.":{fr:"Profil enregistré. Genre, téléphone et e-mail n'ont pas encore pu être enregistrés – la production doit activer les nouvelles règles.",it:"Profilo salvato. Genere, telefono ed e-mail non sono ancora stati salvati – la produzione deve attivare le nuove regole.",en:"Profile saved. Gender, phone and email could not be saved yet – the production has to activate the new app rules."},
 "Willkommen bestätigt":{fr:"Bienvenue confirmée",it:"Benvenuto confermato",en:"Welcome confirmed"},
 "Willkommen noch nicht bestätigt":{fr:"Bienvenue pas encore confirmée",it:"Benvenuto non ancora confermato",en:"Welcome not yet confirmed"},
 "Danke – viel Spass mit der App!":{fr:"Merci – amuse-toi bien avec l'app !",it:"Grazie – buon divertimento con l'app!",en:"Thanks – enjoy the app!"},
 "Crewliste: Telefonnummer sehen":{fr:"Liste de l'équipe : voir le numéro de téléphone",it:"Lista crew: vedere il numero di telefono",en:"Crew list: see phone number"},
 "Crewliste: E-Mail sehen":{fr:"Liste de l'équipe : voir l'e-mail",it:"Lista crew: vedere l'e-mail",en:"Crew list: see email"},
 "E-Mail-Adressen sehen":{fr:"Voir les adresses e-mail",it:"Vedere gli indirizzi e-mail",en:"See email addresses"},
 "E-Mail-Adressen":{fr:"Adresses e-mail",it:"Indirizzi e-mail",en:"Email addresses"},
 "Benutzer:innen ohne Rolle":{fr:"Utilisateurs sans rôle",it:"Utenti senza ruolo",en:"Users without a role"},
 "Was Personen ohne Rolle sehen. Ausgeschaltet sehen es nur Personen, deren Rolle es erlaubt.":{fr:"Ce que voient les personnes sans rôle. Désactivé, seules les personnes dont le rôle l'autorise le voient.",it:"Cosa vedono le persone senza ruolo. Disattivato, lo vedono solo le persone il cui ruolo lo consente.",en:"What people without a role see. When off, only people whose role allows it see it."},
 "Telefonnummern sehen":{fr:"Voir les numéros de téléphone",it:"Vedere i numeri di telefono",en:"See phone numbers"},
 "Telefonnummern":{fr:"Numéros de téléphone",it:"Numeri di telefono",en:"Phone numbers"},
 "Ausgeschaltet sehen nur Personen mit einer Rolle, die «Telefonnummern sehen» erlaubt, die Nummern in Crewliste und Kontaktkarten.":{fr:"Désactivé, seules les personnes dont le rôle autorise « Voir les numéros de téléphone » voient les numéros dans la liste et les fiches contact.",it:"Disattivato, solo le persone con un ruolo che consente «Vedere i numeri di telefono» vedono i numeri nella lista crew e nelle schede contatto.",en:"When off, only people whose role allows “See phone numbers” see the numbers in the crew list and contact cards."},
 "Telefonnummern allen Benutzer:innen ohne Rolle anzeigen":{fr:"Afficher les numéros à tous les utilisateurs sans rôle",it:"Mostrare i numeri a tutti gli utenti senza ruolo",en:"Show phone numbers to all users without a role"},
 "Drehplan sehen":{fr:"Voir le plan",it:"Vedere il piano",en:"See schedule"},
 "Prep sehen":{fr:"Voir la prep",it:"Vedere la prep",en:"See prep"},
 "Callsheet sehen":{fr:"Voir la callsheet",it:"Vedere il callsheet",en:"See call sheet"},
 "Drehbuch sehen":{fr:"Voir le scénario",it:"Vedere la sceneggiatura",en:"See script"},
 "Blocking sehen":{fr:"Voir le blocking",it:"Vedere il blocking",en:"See blocking"},
 "Crewliste sehen":{fr:"Voir la liste",it:"Vedere la lista",en:"See crew list"},
 "Telefon sehen":{fr:"Voir le téléphone",it:"Vedere il telefono",en:"See phone"},
 "E-Mail sehen":{fr:"Voir l'e-mail",it:"Vedere l'e-mail",en:"See email"},
 "Externe Kontakte sehen":{fr:"Voir contacts externes",it:"Vedere contatti esterni",en:"See external contacts"},
 "Essen sehen":{fr:"Voir les repas",it:"Vedere i pasti",en:"See food"},
 "Geburtstage sehen":{fr:"Voir les anniversaires",it:"Vedere i compleanni",en:"See birthdays"},
 "VCF exportieren":{fr:"Exporter VCF",it:"Esportare VCF",en:"Export VCF"},
 "Meine Termine sehen":{fr:"Voir mes rdv",it:"Vedere I miei appuntamenti",en:"See MY appointments"},
 "Alle Termine sehen":{fr:"Voir tous les rdv",it:"Vedere tutti gli appuntamenti",en:"See all appointments"},
 "Benutzer sehen":{fr:"Voir les utilisateurs",it:"Vedere gli utenti",en:"See users"},
 "Benutzer ändern":{fr:"Modifier les utilisateurs",it:"Modificare gli utenti",en:"Edit users"},
 "Benutzer einladen":{fr:"Inviter des utilisateurs",it:"Invitare utenti",en:"Invite users"},
 "Anfragen freischalten":{fr:"Approuver les demandes",it:"Approvare le richieste",en:"Approve requests"},
 "Einstellungen ändern":{fr:"Modifier les paramètres",it:"Modificare le impostazioni",en:"Change settings"},
 "Drehplan":{fr:"Plan de tournage",it:"Piano",en:"Schedule"},
 "Drehbuch":{fr:"Scénario",it:"Sceneggiatura",en:"Script"},
 "Crewliste":{fr:"Liste de l'équipe",it:"Lista crew",en:"Crew list"},
 "Termine":{fr:"Rendez-vous",it:"Appuntamenti",en:"Appointments"},
 "Benutzer":{fr:"Utilisateurs",it:"Utenti",en:"Users"},
 "App":{fr:"App",it:"App",en:"App"},
 "Online":{fr:"En ligne",it:"Online",en:"Online"},
 "gerade aktiv":{fr:"actif maintenant",it:"attivo ora",en:"active now"},
 "Gerade aktiv":{fr:"Actifs maintenant",it:"Attivi ora",en:"Active now"},
 "Gerade ist niemand aktiv.":{fr:"Personne n'est actif en ce moment.",it:"Al momento nessuno è attivo.",en:"Nobody is active right now."},
 "aktiv vor {n} Min.":{fr:"actif il y a {n} min",it:"attivo {n} min fa",en:"active {n} min ago"},
 "aktiv vor {n} Std.":{fr:"actif il y a {n} h",it:"attivo {n} h fa",en:"active {n} h ago"},
 "zuletzt aktiv":{fr:"dernière activité",it:"ultima attività",en:"last active"},
 "Standard":{fr:"Standard",it:"Standard",en:"Default"},
 "Gilt für alle ohne andere Rolle, auch für neue Benutzer:innen.":{fr:"S'applique à tous sans autre rôle, y compris les nouveaux utilisateurs.",it:"Vale per tutti senza altro ruolo, anche per i nuovi utenti.",en:"Applies to everyone without another role, including new users."},
 "Für die App-Verwaltung fehlt die Berechtigung «Einstellungen ändern».":{fr:"Il manque l'autorisation « Modifier les paramètres » pour l'administration.",it:"Per l'amministrazione manca il permesso «Modificare le impostazioni».",en:"The permission “Change settings” is needed for app management."},
 "keine":{fr:"aucun",it:"nessuno",en:"none"},
 "Anmeldung":{fr:"Connexion",it:"Accesso",en:"Sign-in"},
 "Ausgeschaltet verschwindet «Mit Google anmelden» auf der Anmeldeseite. Wer schon mit Google angemeldet ist, bleibt angemeldet.":{fr:"Désactivé, « Se connecter avec Google » disparaît de la page de connexion. Les personnes déjà connectées avec Google le restent.",it:"Disattivato, «Accedi con Google» scompare dalla pagina di accesso. Chi è già connesso con Google resta connesso.",en:"When off, “Sign in with Google” disappears from the sign-in page. People already signed in with Google stay signed in."},
 "Mit Google anmelden anbieten":{fr:"Proposer la connexion avec Google",it:"Offrire l'accesso con Google",en:"Offer sign-in with Google"},
 "Telefon":{fr:"Téléphone",it:"Telefono",en:"Phone"},
 "Sortieren":{fr:"Trier",it:"Ordina",en:"Sort"},
 "Abteilung":{fr:"Département",it:"Reparto",en:"Department"},
 "Status":{fr:"Statut",it:"Stato",en:"Status"},
 "Neueste zuerst":{fr:"Plus récents d'abord",it:"Più recenti prima",en:"Newest first"},
 "Rollen":{fr:"Rôles",it:"Ruoli",en:"Roles"},
 "Rolle":{fr:"Rôle",it:"Ruolo",en:"Role"},
 "Benutzer:in":{fr:"Utilisateur",it:"Utente",en:"User"},
 "Neue Rolle":{fr:"Nouveau rôle",it:"Nuovo ruolo",en:"New role"},
 "Rolle erstellen":{fr:"Créer le rôle",it:"Crea ruolo",en:"Create role"},
 "Rolle löschen":{fr:"Supprimer le rôle",it:"Elimina ruolo",en:"Delete role"},
 "Rolle gespeichert.":{fr:"Rôle enregistré.",it:"Ruolo salvato.",en:"Role saved."},
 "Rolle gelöscht.":{fr:"Rôle supprimé.",it:"Ruolo eliminato.",en:"Role deleted."},
 "Name der Rolle":{fr:"Nom du rôle",it:"Nome del ruolo",en:"Role name"},
 "Name der Rolle, z. B. Catering":{fr:"Nom du rôle, p. ex. Catering",it:"Nome del ruolo, ad es. Catering",en:"Role name, e.g. Catering"},
 "Person":{fr:"personne",it:"persona",en:"person"},
 "Personen":{fr:"personnes",it:"persone",en:"people"},
 "Benutzerdaten sehen":{fr:"Voir les données des utilisateurs",it:"Vedere i dati utente",en:"See user data"},
 "Benutzerdaten ändern":{fr:"Modifier les données des utilisateurs",it:"Modificare i dati utente",en:"Change user data"},
 "Benutzer:innen einladen und Anfragen freischalten":{fr:"Inviter des utilisateurs et approuver les demandes",it:"Invitare utenti e approvare richieste",en:"Invite users and approve requests"},
 "Essen und Allergien in der Crew sehen":{fr:"Voir repas et allergies dans l'équipe",it:"Vedere pasti e allergie nella crew",en:"See food and allergies in the crew list"},
 "Geburtstage in der Crew sehen":{fr:"Voir les anniversaires dans l'équipe",it:"Vedere i compleanni nella crew",en:"See birthdays in the crew list"},
 "Alle Kontakte als VCF exportieren":{fr:"Exporter tous les contacts en VCF",it:"Esportare tutti i contatti come VCF",en:"Export all contacts as VCF"},
 "Termine aller Personen ansehen":{fr:"Voir les rendez-vous de tout le monde",it:"Vedere gli appuntamenti di tutti",en:"See everyone's appointments"},
 "Einstellungen der App ändern":{fr:"Modifier les paramètres de l'app",it:"Modificare le impostazioni dell'app",en:"Change app settings"},
 "Alles, auch Rollen, Admins, Sperren und Backup":{fr:"Tout, y compris rôles, admins, blocage et sauvegarde",it:"Tutto, anche ruoli, admin, blocco e backup",en:"Everything, including roles, admins, blocking and backup"},
 "Alle Berechtigungen ausser «Einstellungen ändern»":{fr:"Tous les droits sauf « Modifier les paramètres de l'app »",it:"Tutti i permessi tranne «Modificare le impostazioni dell'app»",en:"All permissions except “Change app settings”"},
 "Eine Rolle bündelt Berechtigungen. Zuweisen kannst du sie in der Benutzerverwaltung bei der Person unter «Rolle». Ohne Rolle sieht eine Person alle Drehdaten, die Crewliste, das Drehbuch und das Blocking, aber keine Verwaltung. Mit Rolle sieht sie nur die Bereiche, die die Rolle erlaubt.":{fr:"Un rôle regroupe des droits. Attribue-le dans la gestion des utilisateurs, sous « Rôle ». Sans rôle, une personne voit toutes les données de tournage, la liste d'équipe, le scénario et le blocking, mais aucune administration. Avec un rôle, seulement ce que le rôle permet.",it:"Un ruolo raggruppa dei permessi. Assegnalo nella gestione utenti alla voce «Ruolo». Senza ruolo una persona vede tutti i dati delle riprese, la lista crew, la sceneggiatura e il blocking, ma nessuna amministrazione. Con un ruolo solo ciò che il ruolo consente.",en:"A role bundles permissions. Assign it in user management under “Role”. Without a role a person sees all shooting data, the crew list, the script and blocking, but no administration. With a role only what the role allows."},
 "Rolle «{r}» löschen? Personen mit dieser Rolle verlieren ihre Berechtigungen.":{fr:"Supprimer le rôle « {r} » ? Les personnes ayant ce rôle perdent leurs droits.",it:"Eliminare il ruolo «{r}»? Le persone con questo ruolo perdono i permessi.",en:"Delete role “{r}”? People with this role lose its permissions."},
 "Benutzerverwaltung":{fr:"Gestion des utilisateurs",it:"Gestione utenti",en:"User management"},
 "Einstellungen":{fr:"Paramètres",it:"Impostazioni",en:"Settings"},
 "Kontoinfos":{fr:"Infos de compte",it:"Info account",en:"Account info"},
 "Startpasswort":{fr:"Mot de passe initial",it:"Password iniziale",en:"Start password"},
 "Für {e} ein Konto mit Startpasswort anlegen? Beim ersten Anmelden muss die Person ein eigenes Passwort festlegen.":{fr:"Créer un compte avec mot de passe initial pour {e} ? À la première connexion, la personne devra choisir son propre mot de passe.",it:"Creare per {e} un account con password iniziale? Al primo accesso la persona dovrà scegliere una propria password.",en:"Create an account with a start password for {e}? On first sign-in the person must set their own password."},
 "hat schon ein Konto – dafür «Passwort-Link senden» verwenden.":{fr:"a déjà un compte – utilise « Envoyer un lien de mot de passe ».",it:"ha già un account – usa «Invia link password».",en:"already has an account – use “Send password link”."},
 "dein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:":{fr:"ton compte pour l’app d’équipe de TSCHUGGER Tigerblood est prêt :",it:"il tuo account per l’app crew di TSCHUGGER Tigerblood è pronto:",en:"your account for the TSCHUGGER Tigerblood crew app is ready:"},
 "Beim ersten Anmelden legst du ein eigenes Passwort fest.":{fr:"À la première connexion, tu choisis ton propre mot de passe.",it:"Al primo accesso scegli una tua password.",en:"On first sign-in you set your own password."},
 "Gilt nur für die erste Anmeldung. Danach muss die Person ein eigenes Passwort festlegen. Das Startpasswort wird nirgends gespeichert – jetzt weitergeben.":{fr:"Valable uniquement pour la première connexion. Ensuite, la personne doit choisir son propre mot de passe. Le mot de passe initial n’est enregistré nulle part – transmets-le maintenant.",it:"Vale solo per il primo accesso. Poi la persona deve scegliere una propria password. La password iniziale non viene salvata – inoltrala ora.",en:"Valid for the first sign-in only. Then the person must set their own password. The start password isn’t stored anywhere – pass it on now."},
 "Per Mail schicken":{fr:"Envoyer par mail",it:"Invia per mail",en:"Send by mail"},
 "Bitte lege jetzt dein eigenes Passwort fest.":{fr:"Choisis maintenant ton propre mot de passe.",it:"Scegli ora una tua password.",en:"Please set your own password now."},
 "Du hast dich mit einem Startpasswort angemeldet. Es gilt nur einmal.":{fr:"Tu t’es connecté avec un mot de passe initial. Il n’est valable qu’une fois.",it:"Hai effettuato l’accesso con una password iniziale. Vale una sola volta.",en:"You signed in with a start password. It only works once."},
 "Neues Passwort (mind. 8 Zeichen)":{fr:"Nouveau mot de passe (8 caractères min.)",it:"Nuova password (min. 8 caratteri)",en:"New password (min. 8 characters)"},
 "Neues Passwort wiederholen":{fr:"Répéter le nouveau mot de passe",it:"Ripeti la nuova password",en:"Repeat new password"},
 "Passwort speichern":{fr:"Enregistrer le mot de passe",it:"Salva password",en:"Save password"},
 "Passwort gespeichert.":{fr:"Mot de passe enregistré.",it:"Password salvata.",en:"Password saved."},
 "{e} einen Link schicken, mit dem die Person ein neues Passwort festlegt?":{fr:"Envoyer à {e} un lien pour choisir un nouveau mot de passe ?",it:"Inviare a {e} un link per scegliere una nuova password?",en:"Send {e} a link to set a new password?"},
 "Link für ein neues Passwort gesendet an":{fr:"Lien pour un nouveau mot de passe envoyé à",it:"Link per una nuova password inviato a",en:"New-password link sent to"},
 "Bearbeiten":{fr:"Modifier",it:"Modifica",en:"Edit"},
 "Funktion":{fr:"Fonction",it:"Funzione",en:"Role"},
 "Die E-Mail-Adresse kann nicht geändert werden – dafür die Person entfernen und mit der neuen Adresse einladen.":{fr:"L’adresse e-mail ne peut pas être modifiée – supprime la personne et invite-la avec la nouvelle adresse.",it:"L’indirizzo e-mail non si può modificare – rimuovi la persona e invitala con il nuovo indirizzo.",en:"The e-mail address can’t be changed – remove the person and invite the new address."},
 "Zugangsanfragen":{fr:"Demandes d’accès",it:"Richieste di accesso",en:"Access requests"},
 "Diese Personen sind nicht auf der Liste und bitten um Zugang. «Freischalten» lädt sie ein; sie tippen danach auf «Aktualisieren».":{fr:"Ces personnes ne sont pas sur la liste et demandent l’accès. « Autoriser » les invite ; elles touchent ensuite « Actualiser ».",it:"Queste persone non sono nella lista e chiedono l’accesso. «Autorizza» le invita; poi toccano «Aggiorna».",en:"These people are not on the list and ask for access. “Approve” invites them; they then tap “Refresh”."},
 "Freischalten":{fr:"Autoriser",it:"Autorizza",en:"Approve"},
 "Ablehnen":{fr:"Refuser",it:"Rifiuta",en:"Decline"},
 "Freigeschaltet:":{fr:"Autorisé :",it:"Autorizzato:",en:"Approved:"},
 "Anfrage abgelehnt.":{fr:"Demande refusée.",it:"Richiesta rifiutata.",en:"Request declined."},
 "offene Zugangsanfrage – siehe App-Verwaltung.":{fr:"demande d’accès en attente – voir Gestion de l’app.",it:"richiesta di accesso in sospeso – vedi Gestione app.",en:"open access request – see App management."},
 "offene Zugangsanfragen – siehe App-Verwaltung.":{fr:"demandes d’accès en attente – voir Gestion de l’app.",it:"richieste di accesso in sospeso – vedi Gestione app.",en:"open access requests – see App management."},
 "E-Mail mit Anmelde-Link gesendet an":{fr:"E-mail avec lien de connexion envoyé à",it:"E-mail con link di accesso inviata a",en:"E-mail with sign-in link sent to"},
 "Dein Zugang zur TSCHUGGER Crew-App ist freigeschaltet":{fr:"Ton accès à l’app de l’équipe TSCHUGGER est activé",it:"Il tuo accesso all’app della crew TSCHUGGER è attivo",en:"Your access to the TSCHUGGER crew app is approved"},
 "Hallo":{fr:"Bonjour",it:"Ciao",en:"Hello"},
 "dein Zugang zur Crew-App von TSCHUGGER Tigerblood ist freigeschaltet. Melde dich hier mit dieser E-Mail-Adresse an:":{fr:"ton accès à l’app de l’équipe de TSCHUGGER Tigerblood est activé. Connecte-toi ici avec cette adresse e-mail :",it:"il tuo accesso all’app della crew di TSCHUGGER Tigerblood è attivo. Accedi qui con questo indirizzo e-mail:",en:"your access to the TSCHUGGER Tigerblood crew app is approved. Sign in here with this e-mail address:"},
 "Bis bald am Set!":{fr:"À bientôt sur le tournage !",it:"A presto sul set!",en:"See you on set!"},
 "Bitte bestätige deine E-Mail-Adresse:":{fr:"Confirme ton adresse e-mail :",it:"Conferma il tuo indirizzo e-mail:",en:"Please confirm your e-mail address:"},
 "Bestätigungs-Mail konnte nicht gesendet werden:":{fr:"L’e-mail de confirmation n’a pas pu être envoyé :",it:"Impossibile inviare l’e-mail di conferma:",en:"Could not send the confirmation e-mail:"},
 "Kein Zugang":{it:"Nessun accesso",fr:"Pas d’accès",en:"No access"},
 "Deine Adresse ist (noch) nicht für die Crew-App freigeschaltet. Bitte melde dich bei der Produktion.":{it:"Il tuo indirizzo non è (ancora) abilitato per l’app. Contatta la produzione.",fr:"Ton adresse n’est pas (encore) autorisée pour l’app. Contacte la production.",en:"Your address is not (yet) enabled for the crew app. Please contact the production."},
 "Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion.":{it:"Il tuo accesso è stato bloccato. Contatta la produzione.",fr:"Ton accès a été bloqué. Contacte la production.",en:"Your access has been blocked. Please contact the production."},
 "Abmelden":{it:"Esci",fr:"Se déconnecter",en:"Sign out"},
 "Darstellung":{fr:"Affichage",it:"Aspetto",en:"Appearance"},"Dunkel":{fr:"Sombre",it:"Scuro",en:"Dark"},"Hell (gut lesbar)":{fr:"Clair (bonne lisibilité)",it:"Chiaro (ben leggibile)",en:"Light (easy to read)"},
 "Eingeschaltet erscheint bei jeder Szene der Knopf «Script», der die Szene im Drehbuch öffnet.":{fr:"Activé, chaque scène affiche le bouton « Script » qui ouvre la scène dans le scénario.",it:"Se attivo, ogni scena mostra il pulsante «Script» che apre la scena nella sceneggiatura.",en:"When on, every scene shows the “Script” button that opens the scene in the script."},
 "Drehbuch anzeigen":{fr:"Afficher le scénario",it:"Mostra la sceneggiatura",en:"Show script"},
 "Backup":{fr:"Sauvegarde",it:"Backup",en:"Backup"},
 "Sichert Benutzer:innen, Einladungen, Administrator:innen, Einstellungen der App und Geburtstage als Datei. Die Drehdaten selbst kommen aus der Dropbox und brauchen kein Backup.":{fr:"Sauvegarde les utilisateurs, invitations, administrateurs, réglages de l’app et anniversaires dans un fichier. Les données de tournage viennent de la Dropbox et n’ont pas besoin de sauvegarde.",it:"Salva utenti, inviti, amministratori, impostazioni dell’app e compleanni in un file. I dati delle riprese arrivano dalla Dropbox e non serve un backup.",en:"Saves users, invitations, admins, app settings and birthdays to a file. The shooting data comes from Dropbox and needs no backup."},
 "Letztes Backup auf diesem Gerät":{fr:"Dernière sauvegarde sur cet appareil",it:"Ultimo backup su questo dispositivo",en:"Last backup on this device"},
 "Backup herunterladen":{fr:"Télécharger la sauvegarde",it:"Scarica il backup",en:"Download backup"},
 "Backup wiederherstellen":{fr:"Restaurer une sauvegarde",it:"Ripristina il backup",en:"Restore backup"},
 "Beim Wiederherstellen werden die Einträge aus der Datei ergänzt oder überschrieben. Nichts wird gelöscht.":{fr:"La restauration ajoute ou remplace les entrées du fichier. Rien n’est supprimé.",it:"Il ripristino aggiunge o sovrascrive le voci del file. Non viene eliminato nulla.",en:"Restoring adds or overwrites the entries from the file. Nothing is deleted."},
 "Backup gespeichert":{fr:"Sauvegarde enregistrée",it:"Backup salvato",en:"Backup saved"},
 "Einladungen":{fr:"invitations",it:"inviti",en:"invitations"},
 "Datei ist zu gross.":{fr:"Le fichier est trop volumineux.",it:"Il file è troppo grande.",en:"The file is too large."},
 "Datei ist kein gültiges Backup.":{fr:"Ce fichier n’est pas une sauvegarde valide.",it:"Il file non è un backup valido.",en:"The file is not a valid backup."},
 "Backup vom {d} wiederherstellen? Vorhandene Einträge werden ergänzt oder überschrieben.":{fr:"Restaurer la sauvegarde du {d} ? Les entrées existantes seront complétées ou remplacées.",it:"Ripristinare il backup del {d}? Le voci esistenti saranno integrate o sovrascritte.",en:"Restore the backup from {d}? Existing entries will be added to or overwritten."},
 "Wiederhergestellt":{fr:"Restauré",it:"Ripristinato",en:"Restored"},
 "fehlgeschlagen":{fr:"échoué",it:"non riuscito",en:"failed"},
 "Bereiche":{fr:"Rubriques",it:"Sezioni",en:"Sections"},
 "Nur die gewählten Bereiche erscheinen unten in der App. Mindestens einer.":{fr:"Seules les rubriques choisies apparaissent en bas de l’app. Au moins une.",it:"Solo le sezioni scelte appaiono in basso nell’app. Almeno una.",en:"Only the selected sections appear at the bottom of the app. At least one."},
 "Bitte mindestens einen Bereich wählen.":{fr:"Choisis au moins une rubrique.",it:"Scegli almeno una sezione.",en:"Please select at least one section."},
 "Die Daten werden jede Stunde automatisch aus der Dropbox geladen.":{fr:"Les données sont chargées automatiquement depuis la Dropbox toutes les heures.",it:"I dati vengono caricati automaticamente dalla Dropbox ogni ora.",en:"Data is loaded from Dropbox automatically every hour."},
 "Bitte zuerst anmelden.":{fr:"Connecte-toi d’abord.",it:"Prima accedi.",en:"Please sign in first."},
 "Eingeschaltet werden Drehplan, Drehbuch, Crewliste, Callsheets und Motivliste jede Stunde automatisch neu geladen (nur gelesen).":{fr:"Activé, le plan de tournage, le scénario, la liste de l’équipe, les callsheets et la liste des décors sont rechargés automatiquement toutes les heures (lecture seule).",it:"Se attivo, piano di lavorazione, sceneggiatura, lista crew, callsheet e lista location vengono ricaricati automaticamente ogni ora (sola lettura).",en:"When on, schedule, script, crew list, callsheets and location list are reloaded automatically every hour (read-only)."},
 "Daten aus der Dropbox automatisch laden":{fr:"Charger automatiquement les données de la Dropbox",it:"Carica automaticamente i dati dalla Dropbox",en:"Load data from Dropbox automatically"},
 "Nach oben":{fr:"Monter",it:"Sposta su",en:"Move up"},"Nach unten":{fr:"Descendre",it:"Sposta giù",en:"Move down"},"Reihenfolge mit ▲ ▼ ändern.":{fr:"Change l’ordre avec ▲ ▼.",it:"Cambia l’ordine con ▲ ▼.",en:"Change the order with ▲ ▼."},
 "Mein Konto":{it:"Il mio account",fr:"Mon compte",en:"My account"},
 "Angemeldet als":{it:"Connesso come",fr:"Connecté en tant que",en:"Signed in as"},
 "Passwort ändern":{it:"Cambia password",fr:"Changer le mot de passe",en:"Change password"},
 "E-Mail-Adresse ändern":{it:"Cambia indirizzo e-mail",fr:"Changer l’adresse e-mail",en:"Change email address"},
 "Speichern":{it:"Salva",fr:"Enregistrer",en:"Save"},
 "Schliessen":{it:"Chiudi",fr:"Fermer",en:"Close"},
 "Passwort geändert.":{it:"Password modificata.",fr:"Mot de passe modifié.",en:"Password changed."},
 "Aktuelles Passwort falsch.":{it:"Password attuale errata.",fr:"Mot de passe actuel incorrect.",en:"Current password is wrong."},
 "Bestätigungslink an die neue Adresse gesendet. Die Änderung gilt, sobald du ihn antippst.":{it:"Link di conferma inviato al nuovo indirizzo. La modifica vale appena lo tocchi.",fr:"Lien de confirmation envoyé à la nouvelle adresse. Le changement s’applique dès que tu le touches.",en:"Confirmation link sent to the new address. The change applies once you tap it."},
 "Diese Adresse wird schon verwendet.":{it:"Questo indirizzo è già in uso.",fr:"Cette adresse est déjà utilisée.",en:"This address is already in use."},
 "App-Verwaltung":{it:"Gestione app",fr:"Gestion de l’app",en:"App management"},
 "Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen.":{it:"Accesso non raggiungibile. Controlla la connessione internet.",fr:"Connexion impossible. Vérifie la connexion internet.",en:"Sign-in unavailable. Please check your internet connection."},
 "Bitte warten …":{it:"Attendere …",fr:"Un instant …",en:"Please wait …"},
 "Mit Google anmelden":{it:"Accedi con Google",fr:"Se connecter avec Google",en:"Sign in with Google"},
 "oder":{it:"oppure",fr:"ou",en:"or"},
 "Du bist mit Google angemeldet. Passwort und Adresse verwaltest du in deinem Google-Konto.":{it:"Sei connesso con Google. Password e indirizzo si gestiscono nel tuo account Google.",fr:"Tu es connecté avec Google. Mot de passe et adresse se gèrent dans ton compte Google.",en:"You are signed in with Google. Manage password and address in your Google account."},
 "Google-Anmeldung abgebrochen.":{it:"Accesso Google annullato.",fr:"Connexion Google annulée.",en:"Google sign-in cancelled."},
 "Offline – du siehst den zuletzt geladenen Stand.":{it:"Offline – stai vedendo gli ultimi dati caricati.",fr:"Hors ligne – tu vois les dernières données chargées.",en:"Offline – you are seeing the last loaded data."}
});
Object.assign(I18N,{
 "Vorname":{fr:"Prénom",it:"Nome",en:"First name"},
 "Nachname":{fr:"Nom",it:"Cognome",en:"Last name"},
 "Sprache der App":{fr:"Langue de l’app",it:"Lingua dell’app",en:"App language"},
 "Geburtsdatum (optional)":{fr:"Date de naissance (facultatif)",it:"Data di nascita (facoltativa)",en:"Date of birth (optional)"},
 "Profil":{fr:"Profil",it:"Profilo",en:"Profile"},
 "Profil gespeichert.":{fr:"Profil enregistré.",it:"Profilo salvato.",en:"Profile saved."},
 "Bitte ergänze dein Profil.":{fr:"Complète ton profil.",it:"Completa il tuo profilo.",en:"Please complete your profile."},
 "Link zum Zurücksetzen gesendet an":{fr:"Lien de réinitialisation envoyé à",it:"Link per reimpostare inviato a",en:"Reset link sent to"},
 "Schau auch im Spam-Ordner nach.":{fr:"Vérifie aussi tes spams.",it:"Controlla anche lo spam.",en:"Check your spam folder too."},
 "Willkommen!":{fr:"Bienvenue !",it:"Benvenuto!",en:"Welcome!"},
 "Bitte fülle vor dem ersten Start dein Profil aus.":{fr:"Avant de commencer, remplis ton profil.",it:"Prima di iniziare, compila il tuo profilo.",en:"Please fill in your profile before you start."},
 "Name":{fr:"Nom",it:"Nome",en:"Name"},
 "Aus der Crewliste übernommen.":{fr:"Repris de la liste de l’équipe.",it:"Ripreso dalla lista della crew.",en:"Taken from the crew list."},
 "Weiter":{fr:"Continuer",it:"Avanti",en:"Continue"},
 "Essen":{fr:"Alimentation",it:"Alimentazione",en:"Food"},
 "aktiv":{fr:"actifs",it:"attivi",en:"active"},
 "Noch kein Konto":{fr:"Pas encore de compte",it:"Ancora nessun account",en:"No account yet"},
 "keine Angaben":{fr:"non indiqué",it:"non indicato",en:"not given"},
 "Alle Kontakte als VCF":{fr:"Tous les contacts en VCF",it:"Tutti i contatti in VCF",en:"All contacts as VCF"},
 "Kontakte als VCF gespeichert.":{fr:"contacts enregistrés en VCF.",it:"contatti salvati in VCF.",en:"contacts saved as VCF."},
 "Besitzer:in":{fr:"Propriétaire",it:"Proprietario",en:"Owner"},
 "Admin":{fr:"Admin",it:"Admin",en:"Admin"},
 "Liste der Benutzer:innen konnte nicht geladen werden:":{fr:"Impossible de charger la liste des utilisateurs :",it:"Impossibile caricare l’elenco utenti:",en:"Could not load the user list:"},
 "Lade Benutzer:innen …":{fr:"Chargement des utilisateurs …",it:"Caricamento utenti …",en:"Loading users …"},
 "aktiv_1":{fr:"actif",it:"attivo",en:"active"},
 "gesperrt":{fr:"bloqué",it:"bloccato",en:"blocked"},
 "eingeladen":{fr:"invité",it:"invitato",en:"invited"},
 "Administrator:innen":{fr:"Administrateurs",it:"Amministratrici e amministratori",en:"Administrators"},
 "Administrator:innen können Leute einladen und sehen in der Crew Essen und Geburtstage. Sperren und Entfernen kannst nur du. Admins und andere Rollen weist du unten bei der Person unter «Rolle» zu.":{fr:"Les administrateurs peuvent inviter des personnes et voient les repas et anniversaires dans l’équipe. Toi seul peux bloquer et supprimer. Tu attribues admins et autres rôles plus bas, sous « Rôle » de la personne.",it:"Gli amministratori possono invitare persone e vedono pasti e compleanni nella crew. Solo tu puoi bloccare e rimuovere. Admin e altri ruoli li assegni più sotto alla voce «Ruolo» della persona.",en:"Administrators can invite people and see food and birthdays in the crew list. Only you can block and remove. Assign admins and other roles below under “Role” on the person."},
 "Entfernen":{fr:"Supprimer",it:"Rimuovi",en:"Remove"},
 "Nur eingeladene Adressen können ein Konto erstellen (E-Mail/Passwort oder Google). Gesperrte oder entfernte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.":{fr:"Seules les adresses invitées peuvent créer un compte (e-mail/mot de passe ou Google). Les personnes bloquées ou supprimées perdent immédiatement l’accès. Chacun gère lui-même son mot de passe et son adresse e-mail.",it:"Solo gli indirizzi invitati possono creare un account (e-mail/password o Google). Le persone bloccate o rimosse perdono subito l’accesso. Ognuno gestisce da sé password e indirizzo e-mail.",en:"Only invited addresses can create an account (email/password or Google). Blocked or removed people lose access immediately. Everyone manages their own password and email address."},
 "E-Mail-Adresse":{fr:"Adresse e-mail",it:"Indirizzo e-mail",en:"Email address"},
 "Name (optional)":{fr:"Nom (facultatif)",it:"Nome (facoltativo)",en:"Name (optional)"},
 "Einladen":{fr:"Inviter",it:"Invita",en:"Invite"},
 "Alle {n} Adressen aus der Crewliste einladen":{fr:"Inviter les {n} adresses de la liste de l’équipe",it:"Invita tutti i {n} indirizzi della lista crew",en:"Invite all {n} addresses from the crew list"},
 "Benutzer:innen":{fr:"utilisateurs",it:"utenti",en:"users"},
 "noch nicht registriert":{fr:"pas encore inscrits",it:"non ancora registrati",en:"not yet registered"},
 "Benutzer:innen suchen":{fr:"Rechercher un utilisateur",it:"Cerca utente",en:"Search users"},
 "Einladungsmail":{fr:"E-mail d’invitation",it:"E-mail d’invito",en:"Invitation email"},
 "Admin entfernen":{fr:"Retirer admin",it:"Rimuovi admin",en:"Remove admin"},
 "Zum Admin machen":{fr:"Nommer admin",it:"Rendi admin",en:"Make admin"},
 "Sperren":{fr:"Bloquer",it:"Blocca",en:"Block"},
 "Entsperren":{fr:"Débloquer",it:"Sblocca",en:"Unblock"},
 "Einladung löschen":{fr:"Supprimer l’invitation",it:"Elimina invito",en:"Delete invitation"},
 "ist jetzt Admin.":{fr:"est maintenant admin.",it:"ora è admin.",en:"is now admin."},
 "Fehler:":{fr:"Erreur :",it:"Errore:",en:"Error:"},
 "eingeladen.":{fr:"invité.",it:"invitato.",en:"invited."},
 "{n} Adressen aus der Crewliste einladen?":{fr:"Inviter {n} adresses de la liste de l’équipe ?",it:"Invitare {n} indirizzi dalla lista crew?",en:"Invite {n} addresses from the crew list?"},
 "{n} Adressen eingeladen.":{fr:"{n} adresses invitées.",it:"{n} indirizzi invitati.",en:"{n} addresses invited."},
 "Die Besitzerin oder der Besitzer kann nicht gesperrt oder entfernt werden.":{fr:"Le propriétaire ne peut être ni bloqué ni supprimé.",it:"Il proprietario non può essere bloccato né rimosso.",en:"The ownerdmin cannot be blocked or removed."},
 "Gesperrt.":{fr:"Bloqué.",it:"Bloccato.",en:"Blocked."},
 "Entsperrt.":{fr:"Débloqué.",it:"Sbloccato.",en:"Unblocked."},
 "{e} entfernen? Die Person kommt danach nicht mehr in die App.":{fr:"Supprimer {e} ? La personne n’aura plus accès à l’app.",it:"Rimuovere {e}? La persona non potrà più accedere all’app.",en:"Remove {e}? The person will no longer get into the app."},
 "Entfernt.":{fr:"Supprimé.",it:"Rimosso.",en:"Removed."},
 "{e} die Admin-Rechte entziehen?":{fr:"Retirer les droits admin à {e} ?",it:"Togliere i diritti admin a {e}?",en:"Remove admin rights from {e}?"},
 "Admin-Rechte entzogen.":{fr:"Droits admin retirés.",it:"Diritti admin revocati.",en:"Admin rights removed."},
 "Einladung gelöscht.":{fr:"Invitation supprimée.",it:"Invito eliminato.",en:"Invitation deleted."},
 "Daten der Benutzer:innen nicht lesbar":{fr:"Données utilisateurs illisibles",it:"Dati utenti non leggibili",en:"User data not readable"},
 "Firestore-Regeln prüfen.":{fr:"vérifier les règles Firestore.",it:"controllare le regole Firestore.",en:"check the Firestore rules."},
 "Crew-App":{fr:"app de l’équipe",it:"app della crew",en:"crew app"},
 "MAIL_BODY":{de:"Hallo{n}\n\nDu bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet:\n{site}\n\nBeim ersten Mal auf «Erstes Mal hier? Konto erstellen» tippen, mit dieser Adresse ({e}) ein eigenes Passwort wählen und die Bestätigungsmail antippen.\n\nBis bald im Wallis!",fr:"Bonjour{n}\n\nTu as accès à l’app de l’équipe de TSCHUGGER Tigerblood :\n{site}\n\nLa première fois, tape sur « Première fois ici ? Créer un compte », choisis ton propre mot de passe avec cette adresse ({e}) et confirme l’e-mail de vérification.\n\nÀ bientôt en Valais !",it:"Ciao{n}\n\nHai accesso all’app della crew di TSCHUGGER Tigerblood:\n{site}\n\nLa prima volta tocca «Prima volta qui? Crea account», scegli una password con questo indirizzo ({e}) e conferma l’e-mail di verifica.\n\nA presto in Vallese!",en:"Hi{n}\n\nYou now have access to the TSCHUGGER Tigerblood crew app:\n{site}\n\nThe first time, tap “First time here? Create account”, choose your own password with this address ({e}) and confirm the verification email.\n\nSee you in Valais!"},
 "Sprachen der App":{fr:"Langues de l’app",it:"Lingue dell’app",en:"App languages"},
 "Nur diese Sprachen stehen in der App zur Auswahl. Mindestens eine.":{fr:"Seules ces langues sont proposées dans l’app. Au moins une.",it:"Solo queste lingue sono disponibili nell’app. Almeno una.",en:"Only these languages are offered in the app. At least one."},
 "Bitte mindestens eine Sprache wählen.":{fr:"Choisis au moins une langue.",it:"Scegli almeno una lingua.",en:"Please choose at least one language."},
 "Sprachen gespeichert.":{fr:"Langues enregistrées.",it:"Lingue salvate.",en:"Languages saved."},
 "Einstellungen der App":{fr:"Réglages de l’app",it:"Impostazioni dell’app",en:"App settings"},
 "Sprachen":{fr:"Langues",it:"Lingue",en:"Languages"},
 "Ausgeschaltet zeigt die App nur die 1st Unit, ohne die Knöpfe 1st/2nd.":{fr:"Désactivée, l’app n’affiche que la 1st unit, sans les boutons 1st/2nd.",it:"Se disattivata, l’app mostra solo la 1st unit, senza i pulsanti 1st/2nd.",en:"When off, the app shows only the 1st unit, without the 1st/2nd buttons."},
 "Geburtstagsliste allen anzeigen":{fr:"Montrer la liste des anniversaires à tous",it:"Mostra a tutti la lista dei compleanni",en:"Show the birthday list to everyone"},
 "Eingeschaltet sehen alle Benutzer:innen in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).":{fr:"Activée, tous les utilisateurs voient dans l’équipe la liste des anniversaires pendant le tournage (jour et mois seulement, sans l’année).",it:"Se attiva, tutti gli utenti vedono nella crew la lista dei compleanni durante le riprese (solo giorno e mese, senza anno).",en:"When on, all users see the birthday list for the shoot in the crew tab (day and month only, no year)."},
 "3rd Unit anzeigen":{fr:"Afficher la 3rd unit",it:"Mostra la 3rd unit",en:"Show 3rd unit"},
 "Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.":{fr:"Les unités désactivées disparaissent du planning, du callsheet et des lieux. Si seule la 1st unit est active, les boutons d’unité disparaissent.",it:"Le unit disattivate spariscono da Schedule, Callsheet e Locations. Se è attiva solo la 1st unit, i pulsanti delle unit spariscono.",en:"Units that are switched off disappear from Schedule, Callsheet and Locations. If only the 1st unit is on, the unit buttons disappear."},
 "2nd Unit anzeigen":{fr:"Afficher la 2nd unit",it:"Mostra la 2nd unit",en:"Show 2nd unit"},
 "Einstellungen gespeichert.":{fr:"Réglages enregistrés.",it:"Impostazioni salvate.",en:"Settings saved."},
 "Benutzer:innen einladen":{fr:"Inviter des utilisateurs",it:"Invita utenti",en:"Invite users"},
 "Motivliste":{fr:"Liste des lieux",it:"Lista delle location",en:"Location list"},
 "Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.":{fr:"Lien vers le Google Sheet des lieux (colonnes SCRIPT NAME, ADRESSE, SCENES, LINK ; « Tous les utilisateurs disposant du lien peuvent consulter »). Repris lors de la prochaine mise à jour horaire. Vide = liste actuelle.",it:"Link al Google Sheet delle location (colonne SCRIPT NAME, ADRESSE, SCENES, LINK; «Chiunque abbia il link può visualizzare»). Viene ripreso al prossimo aggiornamento orario. Vuoto = lista attuale.",en:"Link to the Google Sheet with the locations (columns SCRIPT NAME, ADRESSE, SCENES, LINK; “Anyone with the link can view”). Picked up at the next hourly update. Empty = current list."},
 "Bitte einen Google-Sheets-Link eingeben.":{fr:"Saisis un lien Google Sheets.",it:"Inserisci un link Google Sheets.",en:"Please enter a Google Sheets link."},
 "Karte":{fr:"Carte",it:"Mappa",en:"Map"},
 "Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.":{fr:"Lien vers la carte du bouton « Map » dans Lieux (p. ex. Google My Maps). Vide = carte par défaut.",it:"Link alla mappa per il pulsante «Map» in Locations (es. Google My Maps). Vuoto = mappa predefinita.",en:"Link to the map for the “Map” button in Locations (e.g. Google My Maps). Empty = default map."},
 "Bitte einen Link mit https:// eingeben.":{fr:"Saisis un lien commençant par https://.",it:"Inserisci un link che inizia con https://.",en:"Please enter a link starting with https://."},
 "Kontostatus":{fr:"Statut du compte",it:"Stato account",en:"Account status"},
 "Konto aktiv":{fr:"Compte actif",it:"Account attivo",en:"Account active"},
 "Gesperrt":{fr:"Bloqué",it:"Bloccato",en:"Blocked"},
 "Eingeladen, noch kein Konto":{fr:"Invité, pas encore de compte",it:"Invitato, ancora nessun account",en:"Invited, no account yet"},
 "Geburtstag":{fr:"Anniversaire",it:"Compleanno",en:"Birthday"},
 "Geburtstagskalender":{fr:"Calendrier des anniversaires",it:"Calendario compleanni",en:"Birthday calendar"},
 "Geburtstage":{fr:"Anniversaires",it:"Compleanni",en:"Birthdays"},
 "Geburtstage während des Drehs":{fr:"Anniversaires pendant le tournage",it:"Compleanni durante le riprese",en:"Birthdays during the shoot"},
 "Keine Geburtstage während des Drehs.":{fr:"Aucun anniversaire pendant le tournage.",it:"Nessun compleanno durante le riprese.",en:"No birthdays during the shoot."},
 "Ich esse alles":{fr:"Je mange de tout",it:"Mangio di tutto",en:"I eat everything"},
 "Vegetarisch":{fr:"Végétarien",it:"Vegetariano",en:"Vegetarian"},
 "Vegan":{fr:"Végan",it:"Vegano",en:"Vegan"},
 "Keine Milchprodukte":{fr:"Sans produits laitiers",it:"Senza latticini",en:"No dairy"},
 "Pescetarisch":{fr:"Pescétarien",it:"Pescetariano",en:"Pescatarian"},
 "Kein Schweinefleisch":{fr:"Sans porc",it:"Senza maiale",en:"No pork"},
 "Halal":{fr:"Halal",it:"Halal",en:"Halal"},
 "Koscher":{fr:"Casher",it:"Kosher",en:"Kosher"},
 "Keine Milchprodukte / laktosefrei":{fr:"Sans produits laitiers / sans lactose",it:"Senza latticini / senza lattosio",en:"No dairy / lactose-free"},
 "Glutenfrei":{fr:"Sans gluten",it:"Senza glutine",en:"Gluten-free"},
 "Ohne Nüsse":{fr:"Sans fruits à coque",it:"Senza frutta a guscio",en:"No nuts"},
 "Ohne Erdnüsse":{fr:"Sans cacahuètes",it:"Senza arachidi",en:"No peanuts"},
 "Ohne Meeresfrüchte":{fr:"Sans fruits de mer",it:"Senza frutti di mare",en:"No seafood"},
 "Ohne Eier":{fr:"Sans œufs",it:"Senza uova",en:"No eggs"},
 "Ernährung":{fr:"Alimentation",it:"Alimentazione",en:"Diet"},
 "Verträglichkeiten":{fr:"Intolérances",it:"Intolleranze",en:"Intolerances"},
 "Geburtsdatum":{fr:"Date de naissance",it:"Data di nascita",en:"Date of birth"},
 "Geschlecht (optional)":{fr:"Genre (facultatif)",it:"Genere (facoltativo)",en:"Gender (optional)"},
 "Männlich":{fr:"Homme",it:"Uomo",en:"Male"},
 "Weiblich":{fr:"Femme",it:"Donna",en:"Female"},
 "Divers":{fr:"Divers",it:"Diverso",en:"Diverse"},
 "Weitere Allergien (optional)":{fr:"Autres allergies (facultatif)",it:"Altre allergie (facoltativo)",en:"Other allergies (optional)"},
 "Allergien / Unverträglichkeiten (optional)":{fr:"Allergies / intolérances (facultatif)",it:"Allergie / intolleranze (facoltativo)",en:"Allergies / intolerances (optional)"},
 "Nur für die Produktion sichtbar.":{fr:"Visible uniquement par la production.",it:"Visibile solo alla produzione.",en:"Only visible to the production."},
 "Allergien":{fr:"Allergies",it:"Allergie",en:"Allergies"}
});
const LANGS=[["de","Deutsch"],["fr","Français"],["it","Italiano"],["en","English"]];
/* languages offered in the app; the main admin picks them (Firestore config/app.langs), cached for the sign-in screen */
let APPLANGS=["de","fr","it","en"];window.UNIT3=false;window.BDAYPUB=false;window.DOCS={};try{window.DOCS=JSON.parse(localStorage.getItem("appdocs")||"{}")||{}}catch(_){}window.GOOGLEON=true;try{window.GOOGLEON=localStorage.getItem("appgoogle")!=="0"}catch(_){}window.PUBV={phone:true,email:true,mycal:false};try{const x=JSON.parse(localStorage.getItem("apppubv")||"null");if(x&&typeof x==="object")Object.assign(window.PUBV,x)}catch(_){}window.SCRIPTON=true;window.TABSON=null;window.TABORDER=null;window.AUTOUPD=true;try{try{const o=JSON.parse(localStorage.getItem("apptaborder")||"null");if(Array.isArray(o))window.TABORDER=o}catch(_){}window.AUTOUPD=localStorage.getItem("appauto")!=="0";try{const t=JSON.parse(localStorage.getItem("apptabs")||"null");if(Array.isArray(t)&&t.length)window.TABSON=t}catch(_){}window.SCRIPTON=localStorage.getItem("appscript")!=="0";window.BDAYPUB=localStorage.getItem("appbdaypub")==="1";const u=localStorage.getItem("appunit2");if(u!==null)window.UNIT2=u==="1";window.UNIT3=localStorage.getItem("appunit3")==="1";const mu=localStorage.getItem("appmap");if(mu)window.MAPURL=mu}catch(_){}
try{const x=JSON.parse(localStorage.getItem("applangs")||"null");if(Array.isArray(x)&&x.length)APPLANGS=x.filter(l=>LANGS.some(z=>z[0]===l))}catch(_){}
function applyLangs(){
  if(!APPLANGS.length)APPLANGS=["de"];
  document.querySelectorAll(".lang button[data-lang],.lang button[data-glang]").forEach(b=>{b.style.display=APPLANGS.includes(b.dataset.lang||b.dataset.glang)?"":"none"});
  document.querySelectorAll(".lang").forEach(d=>{d.style.display=APPLANGS.length<2?"none":""});
  if(!APPLANGS.includes(LANG)){LANG=APPLANGS[0];store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
}
async function loadLangs(){
  try{const {F,db}=await fb();const d=await F.getDoc(F.doc(db,"config","app"));const l=d.exists()&&d.data().langs;
    if(Array.isArray(l)&&l.length){APPLANGS=l.filter(x=>LANGS.some(z=>z[0]===x));try{localStorage.setItem("applangs",JSON.stringify(APPLANGS))}catch(_){}}
    const u2=d.exists()?d.data().unit2!==false:true;if(window.UNIT2!==u2){window.UNIT2=u2;try{localStorage.setItem("appunit2",u2?"1":"0")}catch(_){}render()}
    {const c=d.exists()?d.data():{};const nv={phone:c.phonePublic!==false,email:c.emailPublic!==false,mycal:c.mycalPublic===true};if(JSON.stringify(nv)!==JSON.stringify(window.PUBV)){window.PUBV=nv;try{localStorage.setItem("apppubv",JSON.stringify(nv))}catch(_){}render()}}
    {const go=!(d.exists()&&d.data().googleLogin===false);if(window.GOOGLEON!==go){window.GOOGLEON=go;try{localStorage.setItem("appgoogle",go?"1":"0")}catch(_){}try{const g=document.getElementById("gate");if(g&&!g.hidden&&(AUTHMODE==="login"||AUTHMODE==="register")&&!g.querySelector("input:focus"))showGate(AUTHMODE)}catch(_){}}}
    {const dc=(d.exists()&&d.data().docs)||{};window.DOCS=dc;try{localStorage.setItem("appdocs",JSON.stringify(dc))}catch(_){}}
    const bp=d.exists()&&d.data().bdayPublic===true;if(window.BDAYPUB!==bp){window.BDAYPUB=bp;try{localStorage.setItem("appbdaypub",bp?"1":"0")}catch(_){}render()}
    const to=d.exists()&&Array.isArray(d.data().tabOrder)?d.data().tabOrder:null;if(JSON.stringify(window.TABORDER)!==JSON.stringify(to)){window.TABORDER=to;try{to?localStorage.setItem("apptaborder",JSON.stringify(to)):localStorage.removeItem("apptaborder")}catch(_){}render()}
    const tb=d.exists()&&Array.isArray(d.data().tabs)&&d.data().tabs.length?d.data().tabs:null;if(JSON.stringify(window.TABSON)!==JSON.stringify(tb)){window.TABSON=tb;try{tb?localStorage.setItem("apptabs",JSON.stringify(tb)):localStorage.removeItem("apptabs")}catch(_){}render()}
    const au=d.exists()?d.data().autoUpdate!==false:true;if(window.AUTOUPD!==au){window.AUTOUPD=au;try{localStorage.setItem("appauto",au?"1":"0")}catch(_){}}
    const so=d.exists()?d.data().script!==false:true;if(window.SCRIPTON!==so){window.SCRIPTON=so;try{localStorage.setItem("appscript",so?"1":"0")}catch(_){}render()}
    const u3=d.exists()&&d.data().unit3===true;if(window.UNIT3!==u3){window.UNIT3=u3;try{localStorage.setItem("appunit3",u3?"1":"0")}catch(_){}render()}
    window.LOCSHEET=(d.exists()&&typeof d.data().locSheet==="string")?d.data().locSheet:"";
    const mu=(d.exists()&&typeof d.data().mapUrl==="string")?d.data().mapUrl:"";if((window.MAPURL||"")!==mu){window.MAPURL=mu;try{localStorage.setItem("appmap",mu)}catch(_){}render()}
  }catch(err){console.warn("langs",err)}
  applyLangs();
}
const langSel=(name,v)=>'<select name="'+name+'" id="'+name+'">'+LANGS.filter(([k])=>APPLANGS.includes(k)).map(([k,t])=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+t+'</option>').join("")+'</select>';
const clean=v=>String(v||"").trim().slice(0,80);
const DIETS=[["none","Ich esse alles"],["vegetarian","Vegetarisch"],["vegan","Vegan"],["pescatarian","Pescetarisch"],["nopork","Kein Schweinefleisch"],["halal","Halal"],["kosher","Koscher"]];
const INTOL=[["dairy","Keine Milchprodukte / laktosefrei"],["gluten","Glutenfrei"],["nuts","Ohne Nüsse"],["peanuts","Ohne Erdnüsse"],["shellfish","Ohne Meeresfrüchte"],["eggs","Ohne Eier"]];
/* older profiles stored "nodairy" as diet */
const normDiet=m=>{const o=Object.assign({},m||{});o.intol=Array.isArray(o.intol)?o.intol.slice():[];if(o.diet==="nodairy"){o.diet="none";if(!o.intol.includes("dairy"))o.intol.push("dairy")}return o};
const intolBoxes=(pre,sel)=>'<div class="chk">'+INTOL.map(([k,t])=>'<label class="ck"><input type="checkbox" name="'+pre+'" value="'+k+'"'+((sel||[]).includes(k)?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>';
const readBoxes=(root,pre)=>[...root.querySelectorAll('input[name="'+pre+'"]:checked')].map(x=>x.value);
const dietSel=(name,v,req)=>'<select name="'+name+'" id="'+name+'"'+(req?' required':'')+'>'+(req&&!v?'<option value="" selected>– '+L("bitte wählen")+' –</option>':'')+DIETS.map(([k,t])=>'<option value="'+k+'"'+(k===(v||(req?"":"none"))?' selected':'')+'>'+L(t)+'</option>').join("")+'</select>';
const dietText=m0=>{if(!m0)return"";const m=normDiet(m0);const d=DIETS.find(x=>x[0]===m.diet);const a=String(m.allergies||"").trim();
  return [d&&d[0]!=="none"?L(d[1]):"",...m.intol.map(k=>{const t=INTOL.find(x=>x[0]===k);return t?L(t[1]):""}),a?L("Allergien")+": "+a:""].filter(Boolean).join(" · ")};
const PENDING_KEY="crewprofile:pending";
const splitName=n=>{const p=String(n||"").trim().split(/\s+/).filter(Boolean);return p.length?{firstName:p[0],lastName:p.slice(1).join(" ")}:{firstName:"",lastName:""}};
function crewPerson(email){const e=lc(email);if(!e)return null;for(const g of S.crew)for(const p of (g.people||[]))if(lc(p.email)===e)return p;return null}
let FB=null,ME=null,MEMBER=null,DATAKEY=null,LASTSTAMP=null;
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const lc=s=>String(s||"").trim().toLowerCase();
/* main admin is fixed; further admins are listed by the main admin in Firestore admins/{email} */
let COADMIN=false;
const isOwner=()=>!!(ME&&ME.emailVerified&&ADMINS.includes(lc(ME.email)));
const isAdmin=()=>isOwner()||!!(COADMIN&&ME&&ME.emailVerified);
/* roles: the owner creates roles (roles/{id}: name + perms) and assigns them (userroles/{email}); admins have every permission except the app settings */
/* permissions, grouped by main topic (topic in capitals, short labels so they fit on one line on phones) */
const PERMS=[["view.plan","Drehplan sehen","Drehplan"],["view.prep","Prep sehen","Drehplan"],["view.dispo","Callsheet sehen","Drehplan"],["view.script","Drehbuch sehen","Drehbuch"],["view.blocking","Blocking sehen","Drehbuch"],["view.crew","Crewliste sehen","Crewliste"],["view.phone","Telefon sehen","Crewliste"],["view.email","E-Mail sehen","Crewliste"],["contacts.extra","Externe Kontakte sehen","Crewliste"],["crew.food","Essen sehen","Crewliste"],["crew.bday","Geburtstage sehen","Crewliste"],["crew.vcf","VCF exportieren","Crewliste"],["view.mycal","Meine Termine sehen","Termine"],["mycal.all","Alle Termine sehen","Termine"],["users.view","Benutzer sehen","Benutzer"],["users.edit","Benutzer ändern","Benutzer"],["users.invite","Benutzer einladen","Benutzer"],["users.requests","Anfragen freischalten","Benutzer"],["settings","Einstellungen ändern","App"]];
const VIEWPERMS=PERMS.filter(x=>x[0].startsWith("view.")).map(x=>x[0]);
const ADMIN_DEFAULT=PERMS.map(x=>x[0]).filter(p=>p!=="settings");
let MYPERMS=[],MYROLE="",ADMINPERMS=ADMIN_DEFAULT.slice();
const can=p=>isOwner()||(isAdmin()&&ADMINPERMS.includes(p))||MYPERMS.includes(p);
/* the gear (App-Verwaltung) only with the permission «Einstellungen ändern» */
const canAdm=()=>isOwner()||can("settings");
/* what someone sees: without a role everything as before; with a role (or as admin) only the areas the role allows */
window.viewOK=k=>{if(!ME||isOwner())return true;if(!isAdmin()&&!MYROLE)return k in window.PUBV?window.PUBV[k]!==false:true;return can("view."+k)};
window.canPerm=can;
/* stability: never wait forever on the network (film sets often have weak reception) */
const withTimeout=(p,ms,what)=>Promise.race([p,new Promise((_,rej)=>setTimeout(()=>rej(Object.assign(new Error((what||"request")+" timeout"),{code:"unavailable"})),ms))]);
let FBP=null;
async function fb(){
  if(FB)return FB;
  if(!FBP)FBP=fbInit().catch(err=>{FBP=null;throw err});
  return FBP;
}
async function fbInit(){
  const base="https://www.gstatic.com/firebasejs/"+FB_V+"/";
  const [app,auth,fs]=await withTimeout(Promise.all([import(base+"firebase-app.js"),import(base+"firebase-auth.js"),import(base+"firebase-firestore.js")]),20000,"firebase");
  const a=app.initializeApp(FB_CONFIG);
  FB={app:a,AP:app,A:auth,F:fs,auth:auth.getAuth(a),db:fs.getFirestore(a)};
  FB.auth.languageCode=LANG;
  return FB;
}
/* ---- data: fetch encrypted file, decrypt with the key from Firestore ---- */
/* the encrypted data file is requested right at start, in parallel with the sign-in check; the first load uses that answer */
let PREENC=null;try{if(navigator.onLine!==false)PREENC=fetch(DATA_URL+"?t="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null)}catch(_){}
async function fetchEnc(){if(PREENC){const p=PREENC;PREENC=null;const j=await p;if(j&&j.ct)return j}const ac=typeof AbortController==="function"?new AbortController():null;const tm=setTimeout(()=>ac&&ac.abort(),25000);let r;try{r=await fetch(DATA_URL+"?t="+Date.now(),{cache:"no-store",signal:ac?ac.signal:undefined})}catch(err){throw Object.assign(new Error("network: "+(err&&err.name||err)),{code:"unavailable"})}finally{clearTimeout(tm)}if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
async function getDataKey(){
  if(DATAKEY)return DATAKEY;
  const {F,db}=await fb();const s=await withTimeout(F.getDoc(F.doc(db,"secret","key")),20000,"key");
  if(!s.exists())throw new Error("no key");
  const kv=String(s.data().k||"").trim().replace(/^["'“”«]+|["'“”»]+$/g,"");
  DATAKEY=await crypto.subtle.importKey("raw",b64(kv),{name:"AES-GCM"},false,["decrypt"]);
  return DATAKEY;
}
function applyData(d){
  S.meta=d.meta||null;
  for(const [k,src] of [["days","days"],["crew","crew"],["locs","locations"],["places","places"],["dispos","dispos"],["prepro","prepro"]])S[k]=(CLEAN[k]||(x=>x))(arr(d[src]));
  MEMO.clear();saveCache();S.loaded=true;
}
/* screenplay: separate encrypted file, fetched only when a scene is opened */
window.loadScriptData=async function(){
  try{
    if(!MEMBER&&!isAdmin())throw new Error("not signed in"); /* e.g. offline start: cached copy below */
    const ac=typeof AbortController==="function"?new AbortController():null;const tm=setTimeout(()=>ac&&ac.abort(),30000);
    let r;try{r=await fetch("script.enc.json?t="+Date.now(),{cache:"no-store",signal:ac?ac.signal:undefined})}finally{clearTimeout(tm)}
    if(!r.ok)throw new Error("HTTP "+r.status);
    const enc=await r.json();const key=await getDataKey();
    const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(enc.iv)},key,b64(enc.ct));
    const list=(JSON.parse(new TextDecoder().decode(pt)).script)||[];
    if(list.length)try{localStorage.setItem("scriptcache",JSON.stringify(list))}catch(_){}
    return list;
  }catch(err){ /* offline or slow network: use the last copy loaded on this device */
    let c=null;try{c=JSON.parse(localStorage.getItem("scriptcache")||"null")}catch(_){}
    if(Array.isArray(c)&&c.length)return c;
    throw err;
  }
};
let LOADP=null;
function load(force){
  if(LOADP)return LOADP;
  LOADP=loadOnce(force).finally(()=>{LOADP=null});
  return LOADP;
}
async function loadOnce(force){
  if(!MEMBER&&!isAdmin())return false;
  const enc=await fetchEnc();
  if(!force&&enc.stamp&&enc.stamp===LASTSTAMP&&S.loaded)return true;
  const key=await getDataKey();
  let pt;try{pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(enc.iv)},key,b64(enc.ct))}catch(err){DATAKEY=null;throw err}
  const data=JSON.parse(new TextDecoder().decode(pt));
  if(!data||!Array.isArray(data.days))throw new Error("data format");
  LASTSTAMP=enc.stamp||null;applyData(data);scheduleRender();return true;
}
function loadErr(err){
  const c=(err&&(err.code||err.name))||"",m=(err&&err.message)||String(err);
  let why;
  if(/permission/.test(c)||/permission/i.test(m))why="Kein Zugriff auf den Schlüssel (Firebase-Regeln prüfen)";
  else if(m==="no key")why="Schlüssel fehlt in Firebase (Sammlung secret, Dokument key, Feld k)";
  else if(c==="OperationError"||/decrypt|InvalidAccessError|DataError/i.test(c+m))why="Schlüssel passt nicht zu den Daten (Wert von secret/key prüfen)";
  else if(/^HTTP/.test(m))why="Datendatei nicht gefunden ("+m+")";
  else why=m;
  return L("Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen.")+" ["+why+"]";
}
const isOffline=err=>!navigator.onLine||/unavailable|network|offline|failed to fetch|load failed/i.test(((err&&err.code)||"")+" "+((err&&err.message)||""));
/* ---- membership: invited addresses join once (members/{uid}); blocked = active:false ---- */
async function checkMember(){
  const {F,db}=await fb();const u=ME;
  if(!isOwner()&&u.emailVerified){try{COADMIN=(await F.getDoc(F.doc(db,"admins",lc(u.email)))).exists()}catch(_){COADMIN=false}}
  MYPERMS=[];MYROLE="";ADMINPERMS=ADMIN_DEFAULT.slice();
  if(COADMIN){try{const ad=await F.getDoc(F.doc(db,"roles","admin"));if(ad.exists())ADMINPERMS=(ad.data().perms||[]).filter(p=>PERMS.some(x=>x[0]===p))}catch(_){}}
  if(!isAdmin()){try{const ur=await F.getDoc(F.doc(db,"userroles",lc(u.email)));if(ur.exists()){MYROLE=String(ur.data().role||"");const rd=MYROLE?await F.getDoc(F.doc(db,"roles",MYROLE)):null;if(rd&&rd.exists())MYPERMS=(rd.data().perms||[]).filter(p=>PERMS.some(x=>x[0]===p))}}catch(_){}
    /* no role of their own: the default role «Crew» applies */
    if(!MYROLE){try{const cd=await F.getDoc(F.doc(db,"roles","crew"));if(cd.exists()){MYROLE="crew";MYPERMS=(cd.data().perms||[]).filter(p=>PERMS.some(x=>x[0]===p))}}catch(_){}}}
  const ref=F.doc(db,"members",u.uid);let s=await withTimeout(F.getDoc(ref),20000,"member");
  if(!s.exists()){
    let inv=null;try{inv=await F.getDoc(F.doc(db,"invites",lc(u.email)))}catch(_){}
    if(!inv||!inv.exists()){if(isAdmin()){MEMBER=null;return "ok"}return "none"}
    let pf={};try{const x=JSON.parse(localStorage.getItem(PENDING_KEY)||"null");if(x&&x.email===lc(u.email))pf=x}catch(_){}
    const doc={active:true,email:lc(u.email),name:[pf.firstName,pf.lastName].filter(Boolean).join(" ")||inv.data().name||"",joinedAt:F.serverTimestamp()};
    for(const k of ["firstName","lastName","lang","birthday","gender","diet","allergies"])if(pf[k])doc[k]=pf[k];
    if(Array.isArray(pf.intol)&&pf.intol.length)doc.intol=pf.intol.filter(k=>INTOL.some(x=>x[0]===k));
    if(!doc.firstName&&!doc.lastName){const sp=splitName(inv.data().name);if(sp.firstName){doc.firstName=clean(sp.firstName);if(sp.lastName)doc.lastName=clean(sp.lastName)}}
    await F.setDoc(ref,doc);try{localStorage.removeItem(PENDING_KEY)}catch(_){}
    s=await F.getDoc(ref);
  }
  const m=s.data();if(m.active!==true)return isAdmin()?"ok":"blocked";
  if(m.email!==lc(u.email))F.updateDoc(ref,{email:lc(u.email)}).catch(()=>{});
  MEMBER=m;return "ok";
}
function clearLocal(){try{localStorage.removeItem(CACHE_KEY);localStorage.removeItem("scriptcache");localStorage.removeItem("scriptenc")}catch(_){}S.days=[];S.crew=[];S.locs=[];S.places=[];S.dispos=[];S.prepro=[];S.meta=null;S.loaded=false;MEMO.clear();DATAKEY=null;MEMBER=null;LASTSTAMP=null;SCRIPT=null;COADMIN=false;ADM.loaded=false;ADM.mem=[];ADM.inv=[];ADM.adm=[]}
/* ---- sign-in screen ---- */
let AUTHMODE="login";
const errText=e=>{const c=(e&&e.code)||"";
  if(/invalid-credential|wrong-password|user-not-found|invalid-login/.test(c))return L("E-Mail oder Passwort falsch.");
  if(/email-already-in-use/.test(c))return L("Für diese Adresse gibt es schon ein Konto. Bitte anmelden.");
  if(/invalid-email/.test(c))return L("Ungültige E-Mail-Adresse.");
  if(/weak-password/.test(c))return L("Mindestens 8 Zeichen.");
  if(/too-many-requests/.test(c))return L("Zu viele Versuche. Bitte kurz warten.");
  if(/requires-recent-login/.test(c))return L("Aktuelles Passwort falsch.");
  if(/network/.test(c))return L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen.");
  return (e&&e.message)||String(e)};
function gateEl(){
  let g=document.getElementById("gate");
  if(!g){g=document.createElement("div");g.id="gate";g.className="gate";document.body.appendChild(g);
    g.addEventListener("submit",onGateSubmit);
    g.addEventListener("click",onGateClick);}
  return g;
}
function GBTN(){if(window.GOOGLEON===false||(isIOS()&&isStandalone()))return '';return '<button type="button" class="gbtn ggoogle" data-gact="google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'+L("Mit Google anmelden")+'</button><div class="gor"><span>'+L("oder")+'</span></div>'}
function showGate(mode,msg,isErr){
  AUTHMODE=mode||AUTHMODE;const g=gateEl();
  const em=ME?esc(ME.email):(g.querySelector("#gem")?esc(g.querySelector("#gem").value):"");
  const head='<h2>Tschugger <span>Tigerblood</span></h2>';
  const langs='<div class="lang glang"><button type="button" data-glang="de">DE</button><button type="button" data-glang="fr">FR</button><button type="button" data-glang="it">IT</button><button type="button" data-glang="en">EN</button></div>';
  const note=msg?'<p class="'+(isErr?'gerr':'gok')+'" role="alert">'+esc(msg)+'</p>':'<p class="gerr" role="alert"></p>';
  let f="";
  if(AUTHMODE==="login")f='<form class="gbox" data-f="login">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die auf der Crewliste steht – diese ist bereits freigeschaltet.")+'</p>'+GBTN()+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="current-password" required><button type="submit">'+L("Anmelden")+'</button>'+note+'<button type="button" class="glink" data-gmode="reset">'+L("Passwort vergessen?")+'</button><button type="button" class="glink" data-gmode="register">'+L("Erstes Mal hier? Konto erstellen")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="register")f='<form class="gbox" data-f="register">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die auf der Crewliste steht – diese ist bereits freigeschaltet.")+'</p>'+GBTN()+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="new-password" minlength="8" required><label for="gpw2">'+L("Passwort wiederholen")+'</label><input id="gpw2" type="password" autocomplete="new-password" minlength="8" required><p class="ghint">'+L("Mindestens 8 Zeichen.")+'</p><button type="submit">'+L("Konto erstellen")+'</button>'+note+'<button type="button" class="glink" data-gmode="login">'+L("Schon ein Konto? Anmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="newpw")f='<form class="gbox" data-f="newpw">'+head+'<p class="gtitle">'+L("Bitte lege jetzt dein eigenes Passwort fest.")+'</p><p class="ghint">'+L("Du hast dich mit einem Startpasswort angemeldet. Es gilt nur einmal.")+'</p><p class="ghint"><b>'+em+'</b></p><label for="gpw">'+L("Neues Passwort (mind. 8 Zeichen)")+'</label><input id="gpw" type="password" autocomplete="new-password" minlength="8" required><label for="gpw2">'+L("Neues Passwort wiederholen")+'</label><input id="gpw2" type="password" autocomplete="new-password" minlength="8" required><button type="submit">'+L("Passwort speichern")+'</button>'+note+'<button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="reset")f='<form class="gbox" data-f="reset">'+head+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><button type="submit">'+L("Link zum Zurücksetzen senden")+'</button>'+note+'<button type="button" class="glink" data-gmode="login">'+L("Zurück")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="verify")f='<form class="gbox" data-f="verify">'+head+'<p class="gtitle">'+L("Bitte bestätige zuerst deine E-Mail-Adresse.")+'</p><p class="ghint">'+L("Wir haben dir eine Mail mit einem Bestätigungslink geschickt. Tippe auf den Link und komm dann hierher zurück.")+'</p><p class="ghint"><b>'+em+'</b></p>'+vmStatus()+'<p class="ghint gtip">'+L("Absender: noreply@tschugger-83692.firebaseapp.com – bitte auch im Spam- bzw. Junk-Ordner nachsehen und die Mail als «Kein Spam» markieren.")+'</p><button type="submit">'+L("Ich habe bestätigt")+'</button>'+note+'<button type="button" class="glink" data-gact="resend">'+L("Mail nochmals senden")+'</button>'+(GBTN()?'<p class="ghint">'+L("Gmail-Adresse? Dann geht es ohne Bestätigungs-Mail:")+'</p>'+GBTN():'')+'<button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="denied"||AUTHMODE==="blocked")f='<div class="gbox">'+head+'<p class="gtitle">'+L("Kein Zugang")+'</p><p class="ghint">'+(AUTHMODE==="blocked"?L("Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion."):L("Diese E-Mail-Adresse ist nicht für die Crew-App freigeschaltet."))+'</p><p class="ghint"><b>'+em+'</b></p>'+(AUTHMODE==="blocked"?'':'<p class="ghint gtip">'+L("Bitte melde dich ab und wieder an – mit der E-Mail-Adresse, die auf der Crewliste steht. Diese ist bereits freigeschaltet. Bei Google: das Google-Konto mit dieser Adresse wählen. Stimmt die Adresse auf der Crewliste nicht, melde dich bei der Produktion.")+'</p>'+reqBox())+'<button type="button" class="gbtn" data-gact="signout">'+L("Abmelden und mit Crewliste-Adresse anmelden")+'</button><button type="button" class="glink" data-gact="retry">'+L("Aktualisieren")+'</button>'+langs+'</div>';
  else if(AUTHMODE==="wait")f='<div class="gbox">'+head+'<p class="ghint">'+L("Bitte warten …")+'</p></div>';
  verifyPoll(AUTHMODE==="verify");
  g.innerHTML=f;applyLangs();g.querySelectorAll("[data-glang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.glang===LANG));
  g.hidden=false;document.body.style.overflow="hidden";
  const first=g.querySelector("input:not([value]),input[value='']")||g.querySelector("#gpw");if(first&&AUTHMODE!=="wait")setTimeout(()=>first.focus(),50);
}
let VERIFYT=null;
function verifyPoll(on){clearInterval(VERIFYT);VERIFYT=null;if(!on)return;
  VERIFYT=setInterval(async()=>{try{const {auth}=await fb();const u=auth.currentUser;if(!u){verifyPoll(false);return}
    await u.reload();if(auth.currentUser.emailVerified){verifyPoll(false);await auth.currentUser.getIdToken(true);afterSignIn(auth.currentUser);return}
    if((VERIFYN=(VERIFYN||0)+1)%3===0&&await startExists(u)){verifyPoll(false);afterSignIn(auth.currentUser)}}catch(_){}},5000)}
let VERIFYN=0;
async function startExists(u){try{const {F,db}=await fb();return (await F.getDoc(F.doc(db,"starts",lc(u.email)))).exists()}catch(_){return false}}
function hideGate(){verifyPoll(false);const g=document.getElementById("gate");if(g){g.hidden=true;g.innerHTML=""}document.body.style.overflow=""}
function gateMsg(t,isErr){const p=document.querySelector("#gate .gerr,#gate .gok");if(p){p.className=isErr?"gerr":"gok";p.textContent=t}}
async function onGateSubmit(e){
  e.preventDefault();const f=e.target;const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;gateMsg("",true);
  try{
    const {A,auth}=await fb();const em=f.querySelector("#gem")?f.querySelector("#gem").value.trim():"";const pw=f.querySelector("#gpw")?f.querySelector("#gpw").value:"";
    if(f.dataset.f==="login"){window.__justSignedIn=true;if(window.resetViewState)window.resetViewState();await A.signInWithEmailAndPassword(auth,em,pw)}
    else if(f.dataset.f==="register"){
      if(pw.length<8)throw {code:"weak-password"};
      if(pw!==f.querySelector("#gpw2").value){gateMsg(L("Die Passwörter stimmen nicht überein."),true);if(btn)btn.disabled=false;return}
      window.__justSignedIn=true;if(window.resetViewState)window.resetViewState();const c=await A.createUserWithEmailAndPassword(auth,em,pw);
      await sendVerify(c.user)
    }
    else if(f.dataset.f==="reset"){try{await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),em)}catch(err){if(!/user-not-found/.test(err.code||""))throw err}gateMsg(L("Wenn es für diese Adresse ein Konto gibt, kommt gleich eine Mail zum Zurücksetzen."),false)}
    else if(f.dataset.f==="newpw"){
      if(pw.length<8)throw {code:"weak-password"};
      if(pw!==f.querySelector("#gpw2").value){gateMsg(L("Die Passwörter stimmen nicht überein."),true);if(btn)btn.disabled=false;return}
      const {F,db}=await fb();await A.updatePassword(auth.currentUser,pw);
      await F.updateDoc(F.doc(db,"starts",lc(auth.currentUser.email)),{mustChange:false});START={mustChange:false};
      showMsg(L("Passwort gespeichert."),3000);await afterSignIn(auth.currentUser)}
    else if(f.dataset.f==="verify"){await ME.reload();if(auth.currentUser.emailVerified){await ME.getIdToken(true);await afterSignIn(auth.currentUser)}else if(await startExists(auth.currentUser))await afterSignIn(auth.currentUser);else gateMsg(L("Noch nicht bestätigt. Schau auch im Spam-Ordner nach."),true)}
  }catch(err){console.error(err);gateMsg(errText(err),true)}
  if(btn)btn.disabled=false;
}
/* ---- access request: someone not on the list asks the main admin for access ---- */
let REQ={sent:false,err:""};
function reqBox(){
  if(REQ.sent)return '<p class="gok">'+L("Anfrage gesendet. Du bekommst Zugang, sobald die Produktion sie freigibt – du erhältst dann eine E-Mail, oder tippe hier auf «Aktualisieren».")+'</p>';
  return '<details class="greq"><summary>'+L("Zugang bei der Produktion anfragen")+'</summary>'+
    '<label for="rqn">'+L("Vor- und Nachname")+'</label><input id="rqn" maxlength="80" autocomplete="name">'+
    '<label for="rqf">'+L("Funktion / Department")+'</label><input id="rqf" maxlength="80">'+
    '<label for="rqt">'+L("Nachricht (optional)")+'</label><textarea id="rqt" maxlength="280" rows="2"></textarea>'+
    '<button type="button" class="gbtn" data-gact="request">'+L("Anfrage senden")+'</button>'+(REQ.err?'<p class="gerr">'+esc(REQ.err)+'</p>':'')+'</details>';
}
/* after approval: Firebase sends the person an e-mail with a one-tap sign-in link (needs "E-Mail-Link" sign-in enabled in Firebase);
   if that is not possible, a prepared e-mail opens in the admin's mail app */
async function notifyApproved(em,q){
  const url=location.origin+location.pathname+"?approved=1&em="+encodeURIComponent(em);
  try{
    const {A,auth}=await fb();if(typeof A.sendSignInLinkToEmail!=="function")throw new Error("no email link");
    const keep=auth.languageCode;auth.languageCode=LANG;
    try{await A.sendSignInLinkToEmail(auth,em,{url,handleCodeInApp:true})}finally{auth.languageCode=keep||LANG}
    showMsg(L("E-Mail mit Anmelde-Link gesendet an")+" "+em,6000);return true;
  }catch(err){
    console.warn("mail link",err&&err.code||err);
    location.href=mailto(em,"approved",{vorname:String((q&&q.name)||"").split(/\s+/)[0],name:(q&&q.name)||""});
    return false;
  }
}
/* check again every 5 minutes and when the app comes back to the foreground */
setInterval(()=>{if(ME&&isAdmin()&&document.visibilityState==="visible")checkRequests()},300000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&ME&&can("users.requests"))checkRequests()});
async function checkRequests(){
  try{const {F,db}=await fb();const r=await F.getDocs(F.collection(db,"requests"));const n=r.size||r.docs.length;
    const b=document.getElementById("admBtn");if(b){b.classList.toggle("hasreq",n>0);b.dataset.n=n||"";b.setAttribute("aria-label",L("App-Verwaltung")+(n?" · "+n+" "+L(n===1?"offene Zugangsanfrage – siehe App-Verwaltung.":"offene Zugangsanfragen – siehe App-Verwaltung."):""))}
    if(n&&!checkRequests.told){checkRequests.told=true;showMsg(n+" "+L(n===1?"offene Zugangsanfrage – siehe App-Verwaltung.":"offene Zugangsanfragen – siehe App-Verwaltung."),7000)}}catch(_){}
}
async function sendRequest(){
  const n=String(($("#rqn")||{}).value||"").trim(),f=String(($("#rqf")||{}).value||"").trim(),t=String(($("#rqt")||{}).value||"").trim();
  if(n.length<3){REQ.err=L("Bitte Vor- und Nachname angeben.");showGate(AUTHMODE);return}
  try{const {F,db,auth}=await fb();const em=lc(auth.currentUser&&auth.currentUser.email);if(!em)throw new Error("not signed in");
    await F.setDoc(F.doc(db,"requests",em),{name:n.slice(0,80),role:f.slice(0,80),note:t.slice(0,280),at:F.serverTimestamp()});
    REQ={sent:true,err:""}}catch(err){console.error(err);REQ.err=errText(err)}
  showGate(AUTHMODE);
}
/* Firebase mails (confirmation, password reset): in the app language; if the return link to this site is not
   allowed in Firebase (authorised domains), send the mail without return link instead of failing silently */
/* confirmation mail: status survives gate re-renders; sent automatically when an unconfirmed account
   signs in and no mail went out in the last 10 minutes (accounts from before had never received one) */
const VM={at:0,err:"",busy:false};
function vmKey(u){return "vm:"+(u&&u.uid||"")}
function vmStatus(){
  if(VM.busy)return '<p class="gok">'+L("Mail wird gesendet …")+'</p>';
  if(VM.err)return '<p class="gerr">'+L("Bestätigungs-Mail konnte nicht gesendet werden:")+' '+esc(VM.err)+'</p>';
  if(VM.at)return '<p class="gok">'+L("Mail gesendet um")+' '+new Date(VM.at).toLocaleTimeString(LANG==="en"?"en-GB":LANG+"-CH",{hour:"2-digit",minute:"2-digit"})+'.</p>';
  return '';
}
async function sendVerify(u,manual){
  if(!u||VM.busy)return;VM.busy=true;VM.err="";if(AUTHMODE==="verify")showGate("verify");
  try{const {A}=await fb();await sendMailSafe(A.sendEmailVerification,u);VM.at=Date.now();try{localStorage.setItem(vmKey(u),String(VM.at))}catch(_){}}
  catch(err){console.error("verify mail",err);VM.err=/too-many/.test(err&&err.code||"")?L("Zu viele Versuche – bitte in ein paar Minuten nochmals."):errText(err)}
  finally{VM.busy=false;if(AUTHMODE==="verify")showGate("verify")}
}
function autoVerify(u){
  let last=0;try{last=+localStorage.getItem(vmKey(u))||0}catch(_){}
  if(!VM.at&&last)VM.at=last;
  if(Date.now()-Math.max(last,VM.at)>600000)sendVerify(u);
}
async function sendMailSafe(fn,target){
  const {auth}=await fb();auth.languageCode=LANG;
  try{return await fn(target,{url:location.origin+location.pathname})}
  catch(err){if(/continue-uri|unauthorized-domain|invalid-dynamic-link|missing-continue/.test(err&&err.code||""))return await fn(target);throw err}
}
async function onGateClick(e){
  const lb=e.target.closest("[data-glang]");if(lb){LANG=lb.dataset.glang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;showGate(AUTHMODE);render();return}
  const m=e.target.closest("[data-gmode]");if(m){showGate(m.dataset.gmode);return}
  const a=e.target.closest("[data-gact]");if(!a)return;
  const {A,auth}=await fb();
  if(a.dataset.gact==="signout"){REQ={sent:false,err:""};await A.signOut(auth)}
  else if(a.dataset.gact==="resend"){a.disabled=true;await sendVerify(auth.currentUser,true);a.disabled=false}
  else if(a.dataset.gact==="retry"){if(auth.currentUser)afterSignIn(auth.currentUser)}
  else if(a.dataset.gact==="request"){a.disabled=true;await sendRequest()}
  else if(a.dataset.gact==="google"){
    const prov=new A.GoogleAuthProvider();prov.setCustomParameters({prompt:"select_account"});window.__justSignedIn=true;
    if(window.resetViewState)window.resetViewState();
    try{if(isStandalone())await A.signInWithRedirect(auth,prov);else await A.signInWithPopup(auth,prov)}
    catch(err){const c=err.code||"";
      if(/popup-blocked|operation-not-supported|web-storage/.test(c)){try{await A.signInWithRedirect(auth,prov)}catch(e2){gateMsg(errText(e2),true)}}
      else if(/popup-closed|cancelled-popup/.test(c))gateMsg(L("Google-Anmeldung abgebrochen."),true);
      else gateMsg(errText(err),true)}
  }
}
/* ---- view settings per user: kept on this device and in Firestore (prefs/{uid}), restored on every device and after a restart ---- */
const PREFKEYS=["theme","pv","sv","lv","spt","uf","pu","welcomeAck"];let PREFT=null,PREFAPPLY=false;
{const _store=store;store=function(k,v){_store(k,v);if(!PREFAPPLY&&PREFKEYS.includes(k))savePrefsSoon()}}
function savePrefsSoon(){clearTimeout(PREFT);PREFT=setTimeout(savePrefs,1500)}
async function savePrefs(){
  if(!ME||!ME.uid)return;const p={};
  try{for(const k of PREFKEYS){const v=localStorage.getItem(k);if(v!==null)p[k]=String(v).slice(0,400)}}catch(_){return}
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"prefs",ME.uid),Object.assign(p,{at:F.serverTimestamp()}))}catch(err){console.warn("prefs",err&&err.code||err)}
}
function applyPrefs(p){
  if(!p||typeof p!=="object")return;PREFAPPLY=true;
  try{
    for(const k of PREFKEYS)if(typeof p[k]==="string")try{localStorage.setItem(k,p[k])}catch(_){}
    const js=k=>{try{return JSON.parse(p[k])}catch(_){return null}};
    for(const [k,o] of [["pv",S.pv],["sv",S.sv],["lv",S.lv]]){const x=js(k);if(x&&typeof x==="object")for(const i in o)if(typeof x[i]==="boolean")o[i]=x[i]}
    for(const k of ["uf","pu"]){const x=js(k);if(x&&typeof x==="object")S[k]=Object.assign({},S[k],...["1","2","3"].filter(u=>typeof x[u]==="boolean").map(u=>({[u]:x[u]})))}
    if(typeof p.spt==="string")SPT=p.spt==="light"||p.spt==="dark"?p.spt:null;
    if(p.theme==="light"||p.theme==="dark")setTheme(p.theme);
  }finally{PREFAPPLY=false}
  render();
}
async function loadPrefs(){
  if(!ME||!ME.uid)return;
  try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"prefs",ME.uid)),10000,"prefs");
    if(d.exists())applyPrefs(d.data());else savePrefs()}catch(err){console.warn("prefs",err&&err.code||err)}
}
/* ---- documents: every text the app sends or shows (mails, welcome note, disclaimer); editable under App-Verwaltung → Einstellungen → Dokumente ---- */
const DOCDEF={
 disclaimer:{t:"Disclaimer (BETA-Hinweis)",use:"Wird in der Willkommensnachricht und in den Mails als {disclaimer} eingesetzt.",
  body:"Hinweis: Die App ist eine BETA-Testversion. Alle angezeigten Daten sind ohne Gewähr. Die Produktion und die Entwickler:innen übernehmen KEINE Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Daten. Verbindlich sind immer die offiziellen Unterlagen der Produktion (Drehplan, Callsheet, Dispo)."},
 welcome:{t:"Willkommensnachricht",use:"Erscheint beim ersten Login und muss bestätigt werden. Betreff = Titel, Absätze durch eine Leerzeile trennen.",
  subject:"Herzlich willkommen in der TSCHUGGER-App!",
  body:"Schön, dass du dabei bist. Hier findest du Drehplan, Callsheets, Crewliste, Locations und Drehbuch von TSCHUGGER Tigerblood an einem Ort.\n\n{disclaimer}\n\nAlle Inhalte sind vertraulich und nur für die Crew bestimmt – bitte nicht weitergeben.\n\nFehler entdeckt oder einen Wunsch? Melde dich bei Stefan Künzler."},
 invite:{t:"Einladungs-Mail",use:"Crewliste «Einladungs-Mail schicken» und App-Verwaltung «Einladungsmail».",
  subject:"Dein Zugang zur TSCHUGGER Crew-App",
  body:"Hallo {vorname}\n\ndu bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet. Dort findest du Drehplan, Callsheets, Crewliste, Locations und das Drehbuch.\n\nSo geht's:\n1. {app}\n2. «Konto erstellen» mit genau dieser E-Mail-Adresse: {email}\n3. Bestätigungs-Mail öffnen und auf den Link tippen – bitte auch im Spam-Ordner nachsehen.\n\n{disclaimer}\n\nBis bald am Set!"},
 approved:{t:"Freischaltungs-Mail (Zugangsanfrage)",use:"Beim Freischalten einer Anfrage, wenn der automatische Anmelde-Link nicht verschickt werden kann.",
  subject:"Dein Zugang zur TSCHUGGER Crew-App ist freigeschaltet",
  body:"Hallo {vorname}\n\ndein Zugang zur Crew-App von TSCHUGGER Tigerblood ist freigeschaltet. Melde dich hier mit dieser E-Mail-Adresse ({email}) an:\n{app}\n\n{disclaimer}\n\nBis bald am Set!"},
 startpw:{t:"Startpasswort-Mail",use:"«Per Mail schicken» nach «Startpasswort erzeugen».",
  subject:"Dein Zugang zur TSCHUGGER Crew-App",
  body:"Hallo {vorname}\n\ndein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:\n{app}\n\nE-Mail: {email}\nStartpasswort: {passwort}\n\nBeim ersten Anmelden legst du ein eigenes Passwort fest.\n\n{disclaimer}\n\nBis bald am Set!"}};
const docRaw=k=>{const c=(window.DOCS||{})[k];const d=DOCDEF[k];return {subject:c&&typeof c.subject==="string"&&c.subject.trim()?c.subject:(d.subject||""),body:c&&typeof c.body==="string"&&c.body.trim()?c.body:d.body,custom:!!(c&&(c.body||c.subject))}};
function docGet(k,v){v=v||{};const r=docRaw(k);
  const map=Object.assign({app:location.origin+location.pathname,disclaimer:k==="disclaimer"?"":docRaw("disclaimer").body,vorname:"",name:"",email:"",passwort:""},v);
  const fill=t=>String(t||"").replace(/\{(\w+)\}/g,(m,x)=>x in map?map[x]:m).replace(/\n{3,}/g,"\n\n").replace(/^Hallo \n/,"Hallo\n");
  return {subject:fill(r.subject),body:fill(r.body)}}
const mailto=(em,k,v)=>{const d=docGet(k,Object.assign({email:em},v));return "mailto:"+encodeURIComponent(em)+"?subject="+encodeURIComponent(d.subject)+"&body="+encodeURIComponent(d.body)};
function docsSec(){
  return '<div class="admins docs"><h3>'+L("Dokumente")+'</h3><p class="ahint">'+L("Alle Texte, die die App verschickt oder anzeigt. Platzhalter: {vorname} {name} {email} {app} {passwort} {disclaimer}. Eigene Texte gelten für alle Sprachen; ohne eigenen Text wird die Standardfassung verwendet.")+'</p>'+
    Object.keys(DOCDEF).map(k=>{const d=DOCDEF[k],r=docRaw(k);
      return '<details class="docd" data-sec="doc-'+k+'"'+(SECS["doc-"+k]?' open':'')+'><summary><b>'+esc(L(d.t))+'</b>'+(r.custom?' <span class="ust role">'+L("angepasst")+'</span>':'')+'</summary>'+
        '<form class="docf" data-doc="'+k+'"><p class="ahint">'+esc(L(d.use))+'</p>'+(d.subject!==undefined?'<label>'+L(k==="welcome"?"Titel":"Betreff")+'<input name="ds" maxlength="200" value="'+esc(r.subject)+'"></label>':'')+
        '<label>'+L("Text")+'<textarea name="db" rows="'+(k==="disclaimer"?5:12)+'">'+esc(r.body)+'</textarea></label>'+
        '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Speichern")+'</button>'+(r.custom?'<button type="button" class="lnk" data-docreset="'+k+'">'+L("Standard wiederherstellen")+'</button>':'')+(k!=="welcome"&&k!=="disclaimer"&&ME?'<a class="lnk" href="'+esc(mailto(ME.email,k,{vorname:"Test",name:"Test Person",passwort:"Abc123xyz"}))+'">'+L("Test an mich")+'</a>':'')+'</div></form></details>'}).join("")+
    '<p class="ahint">'+L("Bestätigungs-Mail, Passwort-Zurücksetzen und Anmelde-Link verschickt Firebase. Deren Texte änderst du in der Firebase-Konsole unter Authentication → Templates.")+'</p></div>';
}
document.addEventListener("submit",async e=>{const f=e.target.closest("form.docf");if(!f)return;e.preventDefault();if(!can("settings"))return;
  const k=f.dataset.doc,msg=f.querySelector(".amsg"),btn=f.querySelector("button[type=submit]");btn.disabled=true;msg.className="amsg";msg.textContent="";
  const val={body:String(f.db.value||"").replace(/\r/g,"")};if(f.ds)val.subject=String(f.ds.value||"").trim();
  if(val.body.trim()===(DOCDEF[k].body||"").trim()&&(val.subject===undefined||val.subject===(DOCDEF[k].subject||"")))val.body="",val.subject="";
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"config","app"),{docs:{[k]:val}},{merge:true});window.DOCS=Object.assign({},window.DOCS,{[k]:val});try{localStorage.setItem("appdocs",JSON.stringify(window.DOCS))}catch(_){}
    document.activeElement&&document.activeElement.blur&&document.activeElement.blur();showMsg(L("Gespeichert."),2500);render()}
  catch(err){btn.disabled=false;msg.textContent=(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err))}});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-docreset]");if(!b||!can("settings"))return;const k=b.dataset.docreset;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"config","app"),{docs:{[k]:{body:"",subject:""}}},{merge:true});window.DOCS=Object.assign({},window.DOCS,{[k]:{body:"",subject:""}});render();showMsg(L("Standardtext wiederhergestellt."),2500)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
/* ---- welcome note (BETA, no warranty): shown once to every user until confirmed; the confirmation is kept in the profile ---- */
const WELCOME_VER="1";
const WTXT={
 de:{t:"Herzlich willkommen in der TSCHUGGER-App!",p:["Schön, dass du dabei bist. Hier findest du Drehplan, Callsheets, Crewliste, Locations und Drehbuch von TSCHUGGER Tigerblood an einem Ort.","Bitte beachte: Die App ist eine BETA-Testversion. Alle angezeigten Daten sind ohne Gewähr. Die Produktion und die Entwickler:innen übernehmen KEINE Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Daten. Verbindlich sind immer die offiziellen Unterlagen der Produktion (Drehplan, Callsheet, Dispo).","Alle Inhalte sind vertraulich und nur für die Crew bestimmt – bitte nicht weitergeben.","Fehler entdeckt oder einen Wunsch? Melde dich bei Stefan Künzler."],c:"Ich habe die Hinweise gelesen und verstanden.",b:"Bestätigen"},
 fr:{t:"Bienvenue dans l'app TSCHUGGER !",p:["Ravi·e de t'accueillir. Tu trouves ici le plan de tournage, les callsheets, la liste de l'équipe, les décors et le scénario de TSCHUGGER Tigerblood au même endroit.","Attention : l'app est une version de test BETA. Toutes les données affichées sont sans garantie. La production et les développeurs n'assument AUCUNE garantie quant à l'exactitude, l'exhaustivité ou l'actualité des données. Seuls les documents officiels de la production (plan de tournage, callsheet, dispo) font foi.","Tous les contenus sont confidentiels et réservés à l'équipe – merci de ne pas les diffuser.","Une erreur ou une suggestion ? Contacte Stefan Künzler."],c:"J'ai lu et compris ces indications.",b:"Confirmer"},
 it:{t:"Benvenuta/o nell'app TSCHUGGER!",p:["Che bello averti a bordo. Qui trovi piano di lavorazione, callsheet, lista crew, location e sceneggiatura di TSCHUGGER Tigerblood in un unico posto.","Nota bene: l'app è una versione di prova BETA. Tutti i dati visualizzati sono senza garanzia. La produzione e gli sviluppatori NON si assumono alcuna garanzia sulla correttezza, completezza o attualità dei dati. Fanno fede sempre i documenti ufficiali della produzione (piano di lavorazione, callsheet, dispo).","Tutti i contenuti sono riservati e destinati solo alla crew – per favore non diffonderli.","Hai trovato un errore o hai un desiderio? Rivolgiti a Stefan Künzler."],c:"Ho letto e compreso le indicazioni.",b:"Conferma"},
 en:{t:"Welcome to the TSCHUGGER app!",p:["Great to have you on board. Here you'll find the shooting schedule, call sheets, crew list, locations and script of TSCHUGGER Tigerblood in one place.","Please note: the app is a BETA test version. All data shown is without guarantee. The production and the developers accept NO liability for the data being correct, complete or up to date. The official production documents (schedule, call sheet, dispo) are always binding.","All content is confidential and for the crew only – please do not share it.","Found a mistake or have a wish? Get in touch with Stefan Künzler."],c:"I have read and understood these notes.",b:"Confirm"}};
let WELCOME_OPEN=false;
async function welcomeDone(){
  if(MEMBER&&MEMBER.welcomeAck&&MEMBER.welcomeVer===WELCOME_VER)return true;
  let loc="";try{loc=localStorage.getItem("welcomeAck")||""}catch(_){}
  if(loc&&loc.split("|")[1]===WELCOME_VER)return true;
  try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"prefs",ME.uid)),8000,"prefs");const w=d.exists()&&d.data().welcomeAck;if(w&&String(w).split("|")[1]===WELCOME_VER){try{localStorage.setItem("welcomeAck",w)}catch(_){}return true}}catch(_){}
  return false;
}
async function maybeWelcome(){
  if(!ME||WELCOME_OPEN||ONBOARD)return;
  if(await welcomeDone())return;
  WELCOME_OPEN=true;let T=WTXT[LANG]||WTXT.de;
  if(LANG==="de"||docRaw("welcome").custom||docRaw("disclaimer").custom){const w=docGet("welcome",{});const dis=docRaw("disclaimer").body.trim();
    T=Object.assign({},WTXT[LANG]||WTXT.de,{t:w.subject,p:w.body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)});T.warnIdx=T.p.findIndex(x=>x===dis)}
  const d=document.createElement("div");d.id="welcome";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  d.innerHTML='<div class="a2box wlbox"><span class="wlbeta">BETA</span><h3>'+esc(T.t)+'</h3>'+T.p.map((x,i)=>'<p'+(i===(T.warnIdx!==undefined?T.warnIdx:1)?' class="wlwarn"':'')+'>'+esc(x)+'</p>').join("")+
    '<label class="wlchk"><input type="checkbox" data-wlok> '+esc(T.c)+'</label><div class="a2b"><button type="button" class="pri" data-wlgo disabled>'+esc(T.b)+'</button></div><p class="amsg" role="alert"></p></div>';
  d.addEventListener("change",e=>{if(e.target.matches("[data-wlok]"))d.querySelector("[data-wlgo]").disabled=!e.target.checked});
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-wlgo]");if(!b||b.disabled)return;b.disabled=true;
    const at=new Date().toISOString();store("welcomeAck",at+"|"+WELCOME_VER);savePrefs();
    try{if(MEMBER){const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{welcomeAck:at,welcomeVer:WELCOME_VER});MEMBER.welcomeAck=at;MEMBER.welcomeVer=WELCOME_VER}}catch(err){console.warn("welcome",err&&err.code||err)}
    d.remove();WELCOME_OPEN=false;showMsg(L("Danke – viel Spass mit der App!"),3000)});
  document.body.appendChild(d);
}
/* ---- presence: signed-in members leave a «last seen» mark every 2 minutes while the app is open (shown to admins) ---- */
let SEENT=null,SEENAT=0;
async function markSeen(){
  if(!ME||!MEMBER||document.visibilityState!=="visible"||Date.now()-SEENAT<100e3)return;SEENAT=Date.now();
  try{const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{lastSeen:F.serverTimestamp()})}catch(err){console.warn("seen",err&&err.code||err)}
}
setInterval(()=>{if(S.tab==="admin"&&ADM.sub==="users"&&document.visibilityState==="visible"&&ADM.loaded&&!ADM.loading){ADM.loading=true;admLoad().catch(()=>{}).finally(()=>{ADM.loading=false})}},60e3);
function startSeen(){clearInterval(SEENT);SEENAT=0;markSeen();SEENT=setInterval(markSeen,120e3)}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")markSeen()});
const seenMs=m=>{const j=m&&m.lastSeen;return j?(j.seconds?j.seconds*1000:(j.toMillis?j.toMillis():Date.parse(j)||0)):0};
const isOnline=m=>Date.now()-seenMs(m)<4*60e3;
function seenText(m){const t=seenMs(m);if(!t)return "";const d=Date.now()-t;if(d<4*60e3)return L("gerade aktiv");
  const mi=Math.round(d/60e3);if(mi<60)return L("aktiv vor {n} Min.").replace("{n}",mi);const h=Math.round(mi/60);if(h<24)return L("aktiv vor {n} Std.").replace("{n}",h);
  return L("zuletzt aktiv")+" "+new Date(t).toLocaleDateString("de-CH")}
let START=null;
async function afterSignIn(u){
  ME=u;
  /* account created by the owner with a start password: counts as confirmed, but a new password must be set first */
  START=null;if(!u.emailVerified||window.__checkStart){try{const {F,db}=await fb();const d=await withTimeout(F.getDoc(F.doc(db,"starts",lc(u.email))),10000,"start");if(d.exists())START=d.data()}catch(_){}}
  if(START&&START.mustChange){showGate("newpw");return}
  if(!u.emailVerified&&!START){showGate("verify");autoVerify(u);return}
  let st;try{st=await checkMember()}catch(err){console.error(err);
    if(isOffline(err)&&S.days.length){hideGate();acctButton(true);showMsg(L("Offline – du siehst den zuletzt geladenen Stand."),6000);return}
    showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);return}
  if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":"denied");return}
  hideGate();acctButton(true);PUBB.loaded=false;PUBB.list=[];loadPrefs();startSeen();
  const prof=MEMBER||{};
  let hasLocal=false;try{hasLocal=!!localStorage.getItem("lang")}catch(_){}
  if(prof.lang&&prof.lang!==LANG&&(window.__justSignedIn||!hasLocal)&&WDS[prof.lang]){LANG=prof.lang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
  try{await load(true)}catch(err){console.error(err);showMsg(isOffline(err)&&S.days.length?L("Offline – du siehst den zuletzt geladenen Stand."):loadErr(err),isOffline(err)?6000:15000)}
  await fillNamesFromCrew();
  /* first start, and whenever gender, phone or e-mail is missing: the profile form must be filled in */
  let partialAt=0;try{partialAt=+localStorage.getItem("profPartial:"+ME.uid)||0}catch(_){}
  const needExtra=(!MEMBER||!MEMBER.gender||!String(MEMBER.phone||"").trim()||!String(MEMBER.contactEmail||"").trim())&&Date.now()-partialAt>12*3600e3;
  if(MEMBER&&(!MEMBER.diet||needExtra))setTimeout(()=>showAcct(true),400);else setTimeout(maybeWelcome,600);
  if(window.__justSignedIn){window.__justSignedIn=false;maybeOfferA2hs(true)}else maybeOfferA2hs(false);
}
/* names come from the crew list (matched by e-mail) when the profile has none yet */
const crewNames=()=>{const p=ME&&crewPerson(ME.email);if(!p||!p.name)return null;const sp=splitName(p.name);return sp.firstName?{firstName:clean(sp.firstName),lastName:clean(sp.lastName||"")}:null};
async function fillNamesFromCrew(){
  if(!MEMBER||!ME)return;
  const cn=crewNames();if(!cn||(MEMBER.firstName===cn.firstName&&(MEMBER.lastName||"")===cn.lastName))return;
  const upd={firstName:cn.firstName,lastName:cn.lastName,name:[cn.firstName,cn.lastName].filter(Boolean).join(" ")};
  try{const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),upd);Object.assign(MEMBER,upd)}catch(err){console.error(err)}
}
/* ---- account sheet: own password, own email, sign out; admin entry ---- */
function acctButton(on){
  let b=document.getElementById("acctBtn");
  if(!b){b=document.createElement("button");b.id="acctBtn";b.className="refresh";b.type="button";
    b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>';
    const r=$("#refresh");r.parentNode.insertBefore(b,r);b.addEventListener("click",showAcct)}
  b.setAttribute("aria-label",L("Mein Konto"));b.title=L("Mein Konto");b.hidden=!on;
  /* gear (admins): App-Verwaltung, between account and refresh */
  let g=document.getElementById("admBtn");
  if(!g){g=document.createElement("button");g.id="admBtn";g.className="refresh";g.type="button";
    g.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span class="reqdot" aria-hidden="true"></span>';
    const r=$("#refresh");r.parentNode.insertBefore(g,r);g.addEventListener("click",()=>{S.tab="admin";S.srcOpen=false;window.scrollTo(0,0);render()})}
  g.setAttribute("aria-label",L("App-Verwaltung"));g.title=L("App-Verwaltung");g.hidden=!(on&&canAdm());
  {const r=$("#refresh");if(r)r.classList.toggle("admhide",!!(on&&canAdm()))} /* admins find «Aktualisieren» in App-Verwaltung → Einstellungen */
  if(on&&can("users.requests"))checkRequests();
}
const isPwUser=()=>!!(ME&&(ME.providerData||[]).some(p=>p.providerId==='password'));
let ONBOARD=false;
/* phone + contact e-mail (required); prefilled from the crew list / sign-in address */
function contactFields(m,pre){const cp=(typeof crewPerson==="function"&&ME&&crewPerson(lc(ME.email)))||{};pre=pre||"";
  return '<label>'+L("Telefon")+'<input type="tel" name="'+pre+'ph" autocomplete="tel" inputmode="tel" required placeholder="+41 79 123 45 67" value="'+esc((m&&m.phone)||(!pre&&cp.phone)||"")+'"></label>'+
    '<label>'+L("E-Mail")+'<input type="email" name="'+pre+'ce" autocomplete="email" required value="'+esc((m&&m.contactEmail)||(!pre&&ME&&ME.email)||(m&&m.email)||"")+'"></label>';}
function nameFields(){
  const cn=crewNames();
  if(cn)return '<div class="pname"><span>'+L("Vorname")+'</span><b>'+esc(cn.firstName)+'</b><span>'+L("Nachname")+'</span><b>'+esc(cn.lastName||"–")+'</b></div><p class="ghint">'+L("Aus der Crewliste übernommen.")+'</p>';
  return '<label>'+L("Vorname")+'<input type="text" name="fn" autocomplete="given-name" required value="'+esc((MEMBER&&MEMBER.firstName)||"")+'"></label><label>'+L("Nachname")+'<input type="text" name="ln" autocomplete="family-name" required value="'+esc((MEMBER&&MEMBER.lastName)||"")+'"></label>';
}
const GENDERS=[["m","Männlich"],["w","Weiblich"],["d","Divers"]];
const genderSel=(n,v,req)=>'<select name="'+n+'"'+(req?' required':'')+'><option value="">–</option>'+GENDERS.map(([k,t])=>'<option value="'+k+'"'+(v===k?' selected':'')+'>'+L(t)+'</option>').join("")+'</select>';
function profileForm(onb){
  return '<form data-af="pf" novalidate>'+nameFields()+contactFields(MEMBER)+'<label>'+L("Sprache der App")+langSel("lg",(MEMBER&&MEMBER.lang)||LANG)+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" autocomplete="bday" value="'+esc((MEMBER&&MEMBER.birthday)||"")+'"></label><label>'+L("Geschlecht")+genderSel("gd",(MEMBER&&MEMBER.gender)||"",true)+'</label><label>'+L("Ernährung")+dietSel("dt",(MEMBER&&MEMBER.diet)?normDiet(MEMBER).diet:"",true)+'</label><label class="full">'+L("Verträglichkeiten")+'</label>'+intolBoxes("pint",normDiet(MEMBER).intol)+'<label class="full">'+L("Weitere Allergien (optional)")+'<input type="text" name="al" maxlength="200" value="'+esc((MEMBER&&MEMBER.allergies)||"")+'"></label><p class="ghint">'+L("Nur für die Produktion sichtbar.")+'</p><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p></form>';
}
function acctInner(){
  return '<div class="myhead"><h2 class="pgt">'+L("Mein Konto")+'</h2><button type="button" class="pillbtn" data-ac="signout">'+L("Abmelden")+'</button></div><p class="acwho">'+L("Angemeldet als")+' <b>'+esc(ME.email)+'</b>'+' · '+L("Rolle")+': <b>'+esc(isOwner()?L("Besitzer:in"):isAdmin()?L("Admin"):MYROLE?(MYROLE==="crew"?"Crew":MYROLE):L("keine"))+'</b>'+(()=>{let w=(MEMBER&&MEMBER.welcomeAck)||"";if(!w)try{w=(localStorage.getItem("welcomeAck")||"").split("|")[0]}catch(_){}return w?' · '+L("Willkommen bestätigt")+' '+esc(new Date(w).toLocaleDateString("de-CH")):''})()+'</p>'+
    (MEMBER||isAdmin()?'<section class="psec"><h4>'+L("Profil")+'</h4>'+profileForm(false)+'</section>':'')+
    '<section class="psec"><h4>'+L("Darstellung")+'</h4><div class="thm" role="group" aria-label="'+L("Darstellung")+'"><button type="button" data-ac="theme" data-thset="dark" aria-pressed="'+(getTheme()==="dark")+'">☾ '+L("Dunkel")+'</button><button type="button" data-ac="theme" data-thset="light" aria-pressed="'+(getTheme()==="light")+'">☀ '+L("Hell (gut lesbar)")+'</button></div></section>'+
    (isPwUser()?'':'<p class="ghint">'+L("Du bist mit Google angemeldet. Passwort und Adresse verwaltest du in deinem Google-Konto.")+'</p>')+(!isPwUser()?'':'<details><summary>'+L("Passwort ändern")+'</summary><form data-af="pw"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neues Passwort")+'<input type="password" name="pw" autocomplete="new-password" minlength="8" required></label><label>'+L("Passwort wiederholen")+'<input type="password" name="pw2" autocomplete="new-password" minlength="8" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p><button type="button" class="glink" data-ac="pwreset">'+L("Passwort vergessen?")+'</button></form></details>'+
    '<details><summary>'+L("E-Mail-Adresse ändern")+'</summary><form data-af="em"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neue E-Mail-Adresse")+'<input type="email" name="em" autocomplete="email" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p></form></details>')+
    '';
}
/* «Mein Konto» is its own page; only the first-start profile (onboarding) stays a dialog */
VIEWS.acct=function(){if(ME)setTimeout(()=>{const v=document.getElementById("view");if(v&&S.tab==="acct")markNeed(v)},0);return ME?'<section class="mypage acpage">'+acctInner()+'</section>':'<div class="empty">'+L("Kein Zugang")+'</div>'};
let ACCTWIRED=false;
function wireAcctPage(){if(ACCTWIRED)return;ACCTWIRED=true;
  document.addEventListener("click",e=>{if(e.target.closest(".acpage"))onAcctClick(e)});
  document.addEventListener("submit",e=>{if(e.target.closest(".acpage"))onAcctSubmit(e)})}
/* required profile fields that are still empty get a pink outline right away; it disappears as soon as they are filled in */
function markNeed(root){const f=root.querySelector('form[data-af="pf"]');if(!f)return;
  const upd=()=>f.querySelectorAll("input[required],select[required]").forEach(el=>el.classList.toggle("need",!String(el.value||"").trim()));
  upd();if(!f.dataset.need){f.dataset.need="1";f.addEventListener("input",upd);f.addEventListener("change",upd)}}
function showAcct(needProfile){
  ONBOARD=needProfile===true&&!!MEMBER;
  if(ONBOARD){
    let s=document.getElementById("acct");
    if(!s){s=document.createElement("div");s.id="acct";s.className="a2hs";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");document.body.appendChild(s);
      s.addEventListener("click",onAcctClick);s.addEventListener("submit",onAcctSubmit)}
    s.innerHTML='<div class="a2box acbox"><h3>'+L("Willkommen!")+'</h3><p>'+L("Bitte fülle vor dem ersten Start dein Profil aus.")+'</p><p class="ghint">'+esc(ME.email)+'</p>'+profileForm(true)+'<div class="a2b"><button class="lnk" data-ac="signout">'+L("Abmelden")+'</button></div></div>';s.hidden=false;markNeed(s);return}
  wireAcctPage();S.tab="acct";S.srcOpen=false;window.scrollTo(0,0);render();
}
async function onAcctClick(e){
  const s=document.getElementById("acct")||{};if(e.target===s){if(!ONBOARD)s.hidden=true;return}
  const b=e.target.closest("[data-ac]");if(!b)return;
  if(b.dataset.ac==="close")s.hidden=true;
  else if(b.dataset.ac==="theme")setTheme(b.dataset.thset);
  else if(b.dataset.ac==="pwreset"){const msg=b.closest("form").querySelector(".amsg");msg.className="amsg";msg.textContent="";b.disabled=true;
    try{const {A,auth}=await fb();await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),auth.currentUser.email);msg.classList.add("ok");msg.textContent=L("Link zum Zurücksetzen gesendet an")+" "+auth.currentUser.email+". "+L("Schau auch im Spam-Ordner nach.")}
    catch(err){console.error(err);msg.textContent=errText(err)}b.disabled=false}
  else if(b.dataset.ac==="admin"){s.hidden=true;S.tab="admin";window.scrollTo(0,0);render()}
  else if(b.dataset.ac==="signout"){s.hidden=true;if(S.tab==="acct")S.tab="plan";const {A,auth}=await fb();await A.signOut(auth)}
}
async function onAcctSubmit(e){
  e.preventDefault();const f=e.target,msg=f.querySelector(".amsg"),btn=f.querySelector("button[type=submit]")||f.querySelector("button");msg.className="amsg";msg.textContent="";
  /* own check of the required fields with a clear message (the browser's own hint is easy to miss on phones) */
  if(f.dataset.af==="pf"){const miss=[];f.querySelectorAll(".miss").forEach(x=>x.classList.remove("miss"));
    f.querySelectorAll("input[required],select[required]").forEach(el=>{const v=String(el.value||"").trim();const bad=!v||(el.type==="email"&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))||(el.type==="tel"&&v.replace(/\D/g,"").length<6);
      if(bad){el.classList.add("miss");const lb=el.closest("label");miss.push(lb?lb.childNodes[0].textContent.trim():el.name)}});
    if(miss.length){msg.textContent=L("Bitte ausfüllen:")+" "+miss.join(", ");const first=f.querySelector(".miss");if(first){first.scrollIntoView({block:"center"});try{first.focus()}catch(_){}}return}}
  btn.disabled=true;
  try{
    const {A,auth,F,db}=await fb();const u=auth.currentUser;
    if(f.dataset.af==="pf"){
      const cn=crewNames();
      let PARTIAL=false;
      const upd={firstName:cn?cn.firstName:clean(f.fn.value),lastName:cn?cn.lastName:clean(f.ln.value),lang:f.lg.value,birthday:f.bd.value||"",gender:f.gd?f.gd.value:"",phone:String(f.ph.value||"").trim().slice(0,40),contactEmail:lc(String(f.ce.value||"").trim()).slice(0,120),diet:f.dt.value,intol:readBoxes(f,"pint"),allergies:String(f.al.value||"").trim().slice(0,200)};
      upd.name=[upd.firstName,upd.lastName].filter(Boolean).join(" ");
      const ref=F.doc(db,"members",u.uid);
      const wr=()=>MEMBER?F.updateDoc(ref,upd):F.setDoc(ref,Object.assign({active:true,email:lc(u.email),joinedAt:F.serverTimestamp()},upd));
      try{await wr()}catch(err){if(!/permission/.test(err&&err.code||""))throw err;await u.reload().catch(()=>{});await u.getIdToken(true);
        try{await wr()}catch(e2){if(!/permission/.test(e2&&e2.code||"")||!("gender" in upd))throw e2;delete upd.gender;delete upd.phone;delete upd.contactEmail;await wr();PARTIAL=true}} /* until the Firestore rules allow «gender», save the rest */
      MEMBER=Object.assign({},MEMBER||{active:true,email:lc(u.email)},upd);
      writeOwnBday(upd.name,upd.birthday);
      if(isAdmin())ADM.loaded=false;
      if(upd.lang!==LANG&&WDS[upd.lang]){LANG=upd.lang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
      if(PARTIAL){try{localStorage.setItem("profPartial:"+u.uid,String(Date.now()))}catch(_){}console.warn("profile: gender/phone/e-mail not saved – Firestore rules not published yet");showMsg(L("Profil gespeichert. Geschlecht, Telefon und E-Mail konnten noch nicht gespeichert werden – die Produktion muss die neuen App-Regeln aktivieren."),9000)}
      if(ONBOARD){ONBOARD=false;document.getElementById("acct").hidden=true;setTimeout(maybeWelcome,300);if(!PARTIAL)showMsg(L("Profil gespeichert."),3000);btn.disabled=false;return}
      msg.classList.add("ok");msg.textContent=L("Profil gespeichert.");btn.disabled=false;return;
    }
    await A.reauthenticateWithCredential(u,A.EmailAuthProvider.credential(u.email,f.cur.value)).catch(err=>{throw /invalid-credential|wrong-password/.test(err.code||"")?{code:"x",message:L("Aktuelles Passwort falsch.")}:err});
    if(f.dataset.af==="pw"){
      if(f.pw.value.length<8)throw {code:"weak-password"};
      if(f.pw.value!==f.pw2.value)throw {code:"x",message:L("Die Passwörter stimmen nicht überein.")};
      await A.updatePassword(u,f.pw.value);msg.classList.add("ok");msg.textContent=L("Passwort geändert.");f.reset();
    }else{
      await A.verifyBeforeUpdateEmail(u,f.em.value.trim(),{url:location.origin+location.pathname});msg.classList.add("ok");msg.textContent=L("Bestätigungslink an die neue Adresse gesendet. Die Änderung gilt, sobald du ihn antippst.");f.reset();
    }
  }catch(err){console.error(err);msg.textContent=(err&&err.code==="x"?err.message:(/email-already-in-use/.test(err.code||"")?L("Diese Adresse wird schon verwendet."):errText(err)))+(err&&err.code&&err.code!=="x"?" ["+err.code+"]":"")}
  btn.disabled=false;
}
/* ---- admin: invitations and members (German only; visible to admins) ---- */
const ADM={inv:[],mem:[],adm:[],q:"",loaded:false,busy:false};
async function admLoad(){
  const {F,db}=await fb();
  const none=()=>({docs:[]}),opt=(ok,pr)=>ok?pr:pr.catch(none);
  const [i,m,a,ro,ur]=await Promise.all([opt(isAdmin(),F.getDocs(F.collection(db,"invites"))),opt(isAdmin(),F.getDocs(F.collection(db,"members"))),F.getDocs(F.collection(db,"admins")).catch(none),F.getDocs(F.collection(db,"roles")).catch(none),F.getDocs(F.collection(db,"userroles")).catch(none)]);
  ADM.roles=ro.docs.filter(d=>d.id!=="admin").map(d=>Object.assign({id:d.id},d.data()));
  if(isOwner()&&!ADM.roles.some(x=>x.id==="crew")){const cp=VIEWPERMS.filter(p=>p!=="view.mycal");try{await F.setDoc(F.doc(db,"roles","crew"),{name:"Crew",perms:cp,at:F.serverTimestamp()});ADM.roles.push({id:"crew",name:"Crew",perms:cp})}catch(err){console.warn("crew role",err&&err.code||err)}}{const ad=ro.docs.find(d=>d.id==="admin");ADM.adminPerms=ad?(ad.data().perms||[]):ADMIN_DEFAULT.slice()}ADM.ur={};ur.docs.forEach(d=>{ADM.ur[d.id]=String((d.data()||{}).role||"")});
  if(can("users.requests")){try{const r=await F.getDocs(F.collection(db,"requests"));ADM.req=r.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.reqErr=""}catch(err){ADM.req=[];ADM.reqErr=(err&&err.code)||String(err)}}else{ADM.req=[];ADM.reqErr=""}
  {const b=document.getElementById("admBtn");if(b){b.classList.toggle("hasreq",ADM.req.length>0);b.dataset.n=ADM.req.length||""}}
  ADM.adm=a.docs.map(d=>d.id);ADM.inv=i.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.mem=m.docs.map(d=>Object.assign({uid:d.id},d.data()));ADM.at=Date.now();admIndex();ADM.loaded=true;render();syncBdays();
}
function crewEmails(){const out=[],seen=new Set();for(const g of S.crew)for(const p of (g.people||[])){const e=lc(p.email);if(!e||!/@/.test(e)||seen.has(e))continue;seen.add(e);out.push({email:e,name:p.name||"",role:p.role||""})}return out}
/* collapsible admin sections in the crew tab; open by default, state remembered per section */
const SECS={};try{for(const k of ["cater","bcal"])SECS[k]=localStorage.getItem("sec:"+k)!=="0";SECS.appset=localStorage.getItem("sec:appset")==="1";SECS.upsec=localStorage.getItem("sec:upsec")==="1"}catch(_){SECS.cater=SECS.bcal=true}
const secOpen=(k,title,body)=>'<details class="asec '+k+'" data-sec="'+k+'"'+(SECS[k]!==false?' open':'')+'><summary>'+esc(title)+'</summary><div class="asb">'+body+'</div></details>';
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.dataset||!d.dataset.sec)return;SECS[d.dataset.sec]=d.open;try{localStorage.setItem("sec:"+d.dataset.sec,d.open?"1":"0")}catch(_){}},true);
/* departments that are not fed on set: left out of the catering count */
const NO_CATER=/^(catering|postprod|verleih)/i;
function crewDeptOf(m){
  const e=lc(m.email),k=nkey([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name);
  const x=aix();return (e&&x.dept.get("e:"+e))||(k&&x.dept.get("n:"+k))||"";
}
function cateringHTML(){
  const act=ADM.mem.filter(m=>m.active===true&&!NO_CATER.test(crewDeptOf(m))).map(normDiet);if(!act.length)return"";
  const c={};act.forEach(m=>{if(m.diet&&m.diet!=="none")c["d:"+m.diet]=(c["d:"+m.diet]||0)+1;m.intol.forEach(k=>c["i:"+k]=(c["i:"+k]||0)+1)});
  const parts=[...DIETS.filter(d=>c["d:"+d[0]]).map(d=>c["d:"+d[0]]+" "+L(d[1])),...INTOL.filter(i=>c["i:"+i[0]]).map(i=>c["i:"+i[0]]+" "+L(i[1]))];
  const al=act.filter(m=>String(m.allergies||"").trim()).map(m=>([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||(crewPerson(m.email)||{}).name||m.email)+": "+m.allergies.trim());
  return secOpen("cater",'Catering · '+act.length+' '+L("aktiv"),esc(act.filter(m=>!m.diet||m.diet==="none").length+' '+L("Ich esse alles"))+(parts.length?'<br>'+esc(parts.join(" · ")):'')+(al.length?'<br><span>'+esc(L("Allergien"))+': '+esc(al.join(" · "))+'</span>':''));
}
/* ---- backup (main admin only): users, invites, admins, settings, birthdays as one JSON file ---- */
const BK={busy:false,msg:"",ok:false};
function bkSec(){
  let last="";try{last=localStorage.getItem("bk:last")||""}catch(_){}
  return '<details class="admins asetd" data-sec="backup"'+(SECS.backup?' open':'')+'><summary>'+L("Backup")+'</summary><div class="bk">'+
    '<p class="ahint">'+L("Sichert Benutzer:innen, Einladungen, Administrator:innen, Einstellungen der App und Geburtstage als Datei. Die Drehdaten selbst kommen aus der Dropbox und brauchen kein Backup.")+'</p>'+
    (last?'<p class="ahint">'+L("Letztes Backup auf diesem Gerät")+': '+esc(fmtStamp(last))+'</p>':'')+
    '<div class="bkb"><button type="button" class="abtn" data-bk="dl"'+(BK.busy?' disabled':'')+'>'+L("Backup herunterladen")+'</button>'+
    '<label class="abtn bkup">'+L("Backup wiederherstellen")+'<input type="file" accept="application/json,.json" data-bk="up" hidden></label></div>'+
    '<p class="ahint">'+L("Beim Wiederherstellen werden die Einträge aus der Datei ergänzt oder überschrieben. Nichts wird gelöscht.")+'</p>'+
    (BK.msg?'<p class="amsg'+(BK.ok?' ok':'')+'" role="status">'+esc(BK.msg)+'</p>':'')+'</div></details>';
}
async function bkCollect(){
  const {F,db}=await fb();
  const col=async n=>{const q=await F.getDocs(F.collection(db,n));return q.docs.map(d=>({id:d.id,data:d.data()}))};
  const [members,invites,admins,bdays,cfg]=await Promise.all([col("members"),col("invites"),col("admins"),col("bdays").catch(()=>[]),F.getDoc(F.doc(db,"config","app"))]);
  const plain=v=>JSON.parse(JSON.stringify(v,(k,x)=>x&&typeof x==="object"&&typeof x.toDate==="function"?{__ts:x.toDate().toISOString()}:x));
  return plain({app:"tschugger-crew",version:1,createdAt:new Date().toISOString(),by:ME&&ME.email,config:cfg.exists()?cfg.data():null,members,invites,admins,bdays});
}
async function bkDownload(){
  const data=await bkCollect();const t=new Date();
  const name="tschugger-backup-"+t.getFullYear()+"-"+pad2(t.getMonth()+1)+"-"+pad2(t.getDate())+"-"+pad2(t.getHours())+pad2(t.getMinutes())+".json";
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download=name;a.rel="noopener";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);
  try{localStorage.setItem("bk:last",t.toISOString())}catch(_){}
  return L("Backup gespeichert")+": "+data.members.length+" "+L("Benutzer:innen")+", "+data.invites.length+" "+L("Einladungen")+".";
}
async function bkRestore(file){
  if(file.size>5e6)throw new Error(L("Datei ist zu gross."));
  let d;try{d=JSON.parse(await file.text())}catch(_){throw new Error(L("Datei ist kein gültiges Backup."))}
  if(!d||d.app!=="tschugger-crew"||!Array.isArray(d.members)||!Array.isArray(d.invites))throw new Error(L("Datei ist kein gültiges Backup."));
  if(!confirmSafe(L("Backup vom {d} wiederherstellen? Vorhandene Einträge werden ergänzt oder überschrieben.").replace("{d}",fmtStamp(d.createdAt||""))))return "";
  const {F,db}=await fb();const back=v=>JSON.parse(JSON.stringify(v),(k,x)=>x&&typeof x==="object"&&typeof x.__ts==="string"?F.Timestamp&&F.Timestamp.fromDate?F.Timestamp.fromDate(new Date(x.__ts)):x.__ts:x);
  const own=lc(ME&&ME.email),ok=/^[^/]{1,200}$/;const ops=[];
  if(d.config&&typeof d.config==="object")ops.push(["config","app",d.config]);
  for(const [n,list] of [["admins",d.admins],["invites",d.invites],["members",d.members],["bdays",d.bdays]])
    for(const r of (Array.isArray(list)?list:[]))if(r&&ok.test(String(r.id))&&r.data&&typeof r.data==="object"&&!(n==="members"&&lc(r.data.email)===own))ops.push([n,String(r.id),r.data]);
  let done=0,fail=0;
  for(let i=0;i<ops.length;i+=300){const batch=F.writeBatch(db);ops.slice(i,i+300).forEach(([n,id,v])=>batch.set(F.doc(db,n,id),back(v),{merge:true}));
    try{await batch.commit();done+=Math.min(300,ops.length-i)}catch(err){console.error(err);fail+=Math.min(300,ops.length-i)}}
  ADM.loaded=false;
  return L("Wiederhergestellt")+": "+done+(fail?" · "+L("fehlgeschlagen")+": "+fail:"");
}
document.addEventListener("click",async e=>{const b=e.target.closest('[data-bk="dl"]');if(!b||BK.busy||!isOwner())return;
  BK.busy=true;BK.msg="";render();try{BK.msg=await bkDownload();BK.ok=true}catch(err){console.error(err);BK.msg=errText(err);BK.ok=false}BK.busy=false;render()});
document.addEventListener("change",async e=>{const i=e.target.closest('[data-bk="up"]');if(!i||BK.busy||!isOwner())return;const f=i.files&&i.files[0];i.value="";if(!f)return;
  BK.busy=true;BK.msg="";render();try{const m=await bkRestore(f);if(m){BK.msg=m;BK.ok=!/fehlgeschlagen|échoué|non riuscit|failed/i.test(m)}}catch(err){console.error(err);BK.msg=err.message||String(err);BK.ok=false}BK.busy=false;render()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-tmv]");if(!b)return;e.preventDefault();const r=b.closest(".tbrow"),p=r&&r.parentNode;if(!p)return;
  if(b.dataset.tmv==="up"&&r.previousElementSibling)p.insertBefore(r,r.previousElementSibling);
  else if(b.dataset.tmv==="down"&&r.nextElementSibling)p.insertBefore(r.nextElementSibling,r);
  b.focus()});
/* status of the hourly GitHub update (Dropbox → website), read from status.json in the repository */
const UPST={d:null,at:0,busy:false};
function upLoad(){if(UPST.busy||Date.now()-UPST.at<120000)return;UPST.busy=true;
  fetch("status.json?t="+Date.now(),{cache:"no-store"}).then(r=>r.ok?r.json():null).catch(()=>null).then(d=>{UPST.d=d||{state:"none"};UPST.at=Date.now();UPST.busy=false;if(S.tab==="admin")render()})}
function upSec(){
  upLoad();const d=UPST.d;const GH="https://github.com/furtschellas/Tschugger";
  const when=t=>{try{return new Date(t).toLocaleString(LANG==="en"?"en-GB":LANG+"-CH",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}catch(_){return t||""}};
  let st;if(!d)st='<p class="ahint">'+L("Lade …")+'</p>';
  else if(d.state==="ok")st='<p class="upst ok">● '+L("Läuft")+' – '+L("zuletzt geprüft")+' '+esc(when(d.at))+(d.updatedAt?' · '+L("Daten vom")+' '+esc(when(d.updatedAt)):'')+(d.version?' · '+esc(d.version):'')+'</p>';
  else if(d.state==="off")st='<p class="upst warn">● '+L("In den App-Einstellungen ausgeschaltet")+'</p>';
  else if(d.state==="error")st='<p class="upst err">● '+L("Fehler beim letzten Lauf")+' ('+esc(when(d.at))+'): '+esc(d.msg||"")+'</p>';
  else st='<p class="upst warn">● '+L("Noch nicht eingerichtet")+(d.missing&&d.missing.length?' – '+L("es fehlen")+': '+d.missing.map(m=>'<code>'+esc(m)+'</code>').join(", "):'')+'</p>';
  const ok=d&&d.state==="ok";
  return '<details class="admins asetd upsec" data-sec="upsec"'+(SECS.upsec||!ok?' open':'')+'><summary>'+L("Automatische Aktualisierung (Dropbox → Webseite)")+'</summary>'+st+
    '<p class="ahint">'+L("GitHub liest die Dropbox zweimal pro Stunde (nur lesend), wandelt neue Drehpläne, Crewlisten, Dispos und das Drehbuch um und veröffentlicht sie verschlüsselt auf der Webseite – ohne dass ein Computer laufen muss.")+'</p>'+
    (ok?'':'<ol class="upsteps"><li>'+L("Dropbox-Zugang (nur lesend) erzeugen:")+' <a href="dropbox-setup.html" target="_blank" rel="noopener">dropbox-setup.html</a> → <code>DROPBOX_APP_KEY</code>, <code>DROPBOX_REFRESH_TOKEN</code></li>'+
      '<li>'+L("Claude-API-Schlüssel erstellen:")+' <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a> → <code>ANTHROPIC_API_KEY</code></li>'+
      '<li><code>CREW_KEY</code> – '+L("den Schlüssel der Crew-Daten bekommst du von Claude im Chat.")+'</li>'+
      '<li>'+L("Alle vier in GitHub eintragen:")+' <a href="'+GH+'/settings/secrets/actions" target="_blank" rel="noopener">Settings → Secrets → Actions</a></li>'+
      '<li>'+L("Ersten Lauf starten:")+' <a href="'+GH+'/actions/workflows/dropbox-update.yml" target="_blank" rel="noopener">Actions → «Run workflow»</a></li></ol>')+
    '<p class="ahint"><a href="'+GH+'/actions/workflows/dropbox-update.yml" target="_blank" rel="noopener">'+L("Läufe auf GitHub ansehen")+'</a></p></details>';
}
/* owner only: account with a one-time start password, created in a second Firebase instance so the owner stays signed in */
function genPw(){const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",r=new Uint32Array(12);crypto.getRandomValues(r);
  const x=[...r].map(v=>c[v%c.length]).join("");return x.slice(0,4)+"-"+x.slice(4,8)+"-"+x.slice(8)}
async function createStartAccount(em,nm){
  em=lc(em);const {AP,A,F,db}=await fb();const pw=genPw();
  await F.setDoc(F.doc(db,"starts",em),{mustChange:true,at:F.serverTimestamp()});
  if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:String(nm||"").slice(0,80),role:"",addedAt:F.serverTimestamp()});
  const a2=AP.initializeApp(FB_CONFIG,"start"+Date.now());
  try{const au=typeof A.initializeAuth==="function"&&A.inMemoryPersistence?A.initializeAuth(a2,{persistence:A.inMemoryPersistence}):A.getAuth(a2);
    await A.createUserWithEmailAndPassword(au,em,pw);try{await A.signOut(au)}catch(_){}}
  catch(err){try{await F.deleteDoc(F.doc(db,"starts",em))}catch(_){}throw err}
  finally{try{AP.deleteApp&&await AP.deleteApp(a2)}catch(_){}}
  return pw;
}
function showStartPw(em,nm,pw){
  let d=document.getElementById("pwbox");if(d)d.remove();d=document.createElement("div");d.id="pwbox";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  const app=location.origin+location.pathname;
  const body=L("Hallo")+" "+String(nm||"").split(/\s+/)[0]+",\n\n"+L("dein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:")+"\n"+app+"\n\n"+L("E-Mail")+": "+em+"\n"+L("Startpasswort")+": "+pw+"\n\n"+L("Beim ersten Anmelden legst du ein eigenes Passwort fest.")+"\n\n"+L("Bis bald am Set!");
  d.innerHTML='<div class="a2box acbox"><h3>'+L("Startpasswort")+'</h3><p>'+esc(nm||em)+'<br><small>'+esc(em)+'</small></p><p class="pwshow">'+esc(pw)+'</p><p class="ahint">'+L("Gilt nur für die erste Anmeldung. Danach muss die Person ein eigenes Passwort festlegen. Das Startpasswort wird nirgends gespeichert – jetzt weitergeben.")+'</p>'+
    '<div class="a2b"><button type="button" data-pw="copy">'+L("Kopieren")+'</button><a class="lnk" href="'+esc(mailto(em,"startpw",{vorname:String(nm||"").split(/\s+/)[0],name:nm||"",passwort:pw}))+'">'+L("Per Mail schicken")+'</a><button type="button" class="lnk" data-pw="close">'+L("Schliessen")+'</button></div></div>';
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-pw]");if(e.target===d||(b&&b.dataset.pw==="close")){d.remove();return}
    if(b&&b.dataset.pw==="copy"){try{await navigator.clipboard.writeText(pw);showMsg(L("Kopiert"),2000)}catch(_){showMsg(pw,8000)}}});
  document.body.appendChild(d);
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-pwshow]");if(!b||!isOwner()||!ADM.pw)return;const em=b.dataset.pwshow;const m=ADM.mem.find(x=>x.email===em),i=ADM.inv.find(x=>x.id===em);showStartPw(em,(m&&m.name)||(i&&i.name)||"",ADM.pw[em])});
/* admins: see and change a user's details (registered: profile incl. food; invited: name, role) */
function userInfo(r){
  const m=r.m;if(!m||!(isAdmin()||can("users.view")))return"";
  const g=(GENDERS.find(x=>x[0]===m.gender)||[])[1];
  const wl=m.welcomeAck?L("Willkommen bestätigt")+" "+new Date(m.welcomeAck).toLocaleDateString("de-CH"):L("Willkommen noch nicht bestätigt");
  const bits=[wl,m.phone?"☎ "+m.phone:"",m.contactEmail&&m.contactEmail!==m.email?"✉ "+m.contactEmail:"",m.birthday?L("Geburtsdatum")+": "+m.birthday.split("-").reverse().join("."):"",g?L(g):"",dietText(m)].filter(Boolean);
  return bits.length?'<div class="uinf">'+bits.map(esc).join(" · ")+'</div>':"";
}
/* role picker (owner): Benutzer:in, Admin or one of the custom roles */
const roleOf=e=>{if(ADMINS.includes(e))return "";if(ADM.adm.includes(e))return "admin";const id=ADM.ur[e];return id&&ADM.roles.some(x=>x.id===id)?id:""};
const roleName=id=>id==="admin"?L("Admin"):((ADM.roles.find(x=>x.id===id)||{}).name||"");
const roleSel=r=>'<label class="rolesel">'+L("Rolle")+' <select data-urole="'+esc(r.email)+'"><option value="">'+(ADM.roles.some(x=>x.id==="crew")?esc(((ADM.roles.find(x=>x.id==="crew")||{}).name||"Crew")+" ("+L("Standard")+")"):L("Benutzer:in"))+'</option><option value="admin"'+(roleOf(r.email)==="admin"?' selected':'')+'>'+L("Admin")+'</option>'+ADM.roles.filter(x=>x.id!=="crew").slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),LANG)).map(x=>'<option value="'+esc(x.id)+'"'+(roleOf(r.email)===x.id?' selected':'')+'>'+esc(x.name||x.id)+'</option>').join("")+'</select></label>';
function editForm(r,withRole){
  const m=r.m,i=ADM.inv.find(x=>x.id===r.email)||{},v=x=>esc(x||"");
  return (withRole&&isOwner()&&!ADMINS.includes(r.email)?'<div class="aerole">'+roleSel(r)+'</div>':'')+'<form class="aedit" data-adm="save" data-em="'+esc(r.email)+'">'+
    (m?'<label>'+L("Vorname")+'<input name="fn" maxlength="60" value="'+v(m.firstName)+'"></label><label>'+L("Nachname")+'<input name="ln" maxlength="60" value="'+v(m.lastName)+'"></label>'+
       '<label>'+L("Sprache der App")+langSel("lg",m.lang||"de")+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" value="'+v(m.birthday)+'"></label><label>'+L("Geschlecht (optional)")+genderSel("gd",m.gender||"")+'</label>'+contactFields(m,"e")+
       '<label>'+L("Ernährung")+dietSel("edt",normDiet(m).diet)+'</label><label>'+L("Verträglichkeiten")+'</label>'+intolBoxes("eint",normDiet(m).intol)+'<label>'+L("Weitere Allergien (optional)")+'<input name="eal" maxlength="200" value="'+v(m.allergies)+'"></label>'
     :'<label>'+L("Name")+'<input name="nm" maxlength="80" value="'+v(i.name||r.name)+'"></label>')+
    '<label>'+L("Funktion")+'<input name="rl" maxlength="80" value="'+v(i.role||r.role)+'"></label>'+
    '<p class="ahint">'+L("Die E-Mail-Adresse kann nicht geändert werden – dafür die Person entfernen und mit der neuen Adresse einladen.")+'</p>'+
    '<button type="submit">'+L("Speichern")+'</button></form>';
}
function reqSec(){
  const r=(ADM.req||[]).slice().sort((a,b)=>String(a.name||a.id).localeCompare(String(b.name||b.id),LANG));
  return '<div class="admins areq" id="areq"><h3>'+L("Anfragen von Benutzer:innen")+' <span class="ust '+(r.length?'adm':'')+'">'+r.length+'</span></h3>'+
    (ADM.reqErr?'<p class="admerr">'+L("Anfragen nicht lesbar")+' ('+esc(ADM.reqErr)+') – '+L("Firestore-Regeln prüfen.")+'</p>':
     r.length?'<p class="ahint">'+L("Diese Personen sind nicht auf der Liste und bitten um Zugang. «Freischalten» lädt sie ein; sie tippen danach auf «Aktualisieren».")+'</p>':'<p class="ahint">'+L("Keine offenen Anfragen.")+'</p>')+
    r.map(q=>'<div class="arow"><span><b>'+esc(q.name||"")+'</b> · '+esc(q.id)+(q.role?'<br><small>'+esc(q.role)+'</small>':'')+(q.note?'<br><small>«'+esc(q.note)+'»</small>':'')+'</span>'+
      (can("users.requests")?'<button data-adm="reqok" data-em="'+esc(q.id)+'">'+L("Freischalten")+'</button><button data-adm="reqno" data-em="'+esc(q.id)+'">'+L("Ablehnen")+'</button>':'')+'</div>').join("")+'</div>';
}
const permBoxes=sel=>'<div class="perms">'+[...new Set(PERMS.map(x=>x[2]))].map(g=>'<div class="pgrp"><h5>'+esc(L(g))+'</h5>'+PERMS.filter(x=>x[2]===g).map(([k,t])=>'<label class="ck"><input type="checkbox" name="rp" value="'+k+'"'+((sel||[]).includes(k)?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>').join("")+'</div>';
function rolesSec(){
  const cnt=id=>id==="admin"?ADM.adm.length:id==="crew"?ADM.mem.filter(m=>!ADMINS.includes(m.email)&&!ADM.adm.includes(m.email)&&(!ADM.ur[m.email]||ADM.ur[m.email]==="crew")).length:Object.keys(ADM.ur||{}).filter(e=>ADM.ur[e]===id&&!ADM.adm.includes(e)).length;
  const roles=(ADM.roles||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),LANG));
  const pplLbl=id=>cnt(id)+' '+L(cnt(id)===1?"Person":"Personen");
  const row=(id,name,perms,fixedName)=>{const open=ADM.redit===id;
    return '<div class="arole'+(open?' open':'')+'"><div class="arh"><div class="arn"><b>'+esc(name)+(id==="crew"?' <span class="ust role">'+L("Standard")+'</span>':'')+'</b><small>'+(id==="crew"?L("Gilt für alle ohne andere Rolle, auch für neue Benutzer:innen.")+' ':'')+(perms.length?perms.length+' '+L(perms.length===1?"Berechtigung":"Berechtigungen"):L("Keine Berechtigungen"))+' · '+pplLbl(id)+'</small></div><button type="button" class="pillbtn" data-redit="'+esc(id)+'">'+L(open?"Schliessen":"Bearbeiten")+'</button></div>'+
      (open?'<form class="arolef" data-role="'+esc(id)+'">'+(fixedName?'<input type="hidden" name="rn" value="'+esc(name)+'">':'<label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required value="'+esc(name)+'"></label>')+permBoxes(perms)+
        '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Speichern")+'</button>'+(id==="crew"?'':id==="admin"?'<button type="button" class="lnk" data-rreset>'+L("Standard wiederherstellen")+'</button>':'<button type="button" class="lnk" data-rdel="'+esc(id)+'">'+L("Rolle löschen")+'</button>')+'</div></form>':'')+'</div>'};
  return '<div class="admins"><h3>'+L("Rollen")+'</h3><p class="ahint">'+L("Eine Rolle bündelt Berechtigungen. Zuweisen kannst du sie in der Benutzerverwaltung bei der Person unter «Rolle». Ohne Rolle sieht eine Person alle Drehdaten, die Crewliste, das Drehbuch und das Blocking, aber keine Verwaltung. Mit Rolle sieht sie nur die Bereiche, die die Rolle erlaubt.")+'</p>'+
    '<div class="arole fixed"><div class="arh"><div class="arn"><b>'+L("Besitzer:in")+'</b><small>'+L("Alles, auch Rollen, Admins, Sperren und Backup")+'</small></div></div></div>'+
    row("admin",L("Admin"),ADM.adminPerms||ADMIN_DEFAULT,true)+
    roles.map(ro=>row(ro.id,ro.name||ro.id,arr(ro.perms),false)).join("")+
    (ADM.redit==="new"?'<form class="arolef new" data-role=""><h4>'+L("Neue Rolle")+'</h4><label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required placeholder="'+esc(L("Name der Rolle, z. B. Catering"))+'"></label>'+permBoxes(VIEWPERMS)+'<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Rolle erstellen")+'</button><button type="button" class="lnk" data-redit="new">'+L("Abbrechen")+'</button></div></form>':
      '<button type="button" class="abtn" data-redit="new">+ '+L("Neue Rolle")+'</button>')+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-redit]");if(b&&isOwner()){ADM.redit=ADM.redit===b.dataset.redit?"":b.dataset.redit;render();return}
  if(e.target.closest("[data-rreset]")&&isOwner()){const f=e.target.closest("form");f.querySelectorAll('input[name=rp]').forEach(x=>{x.checked=ADMIN_DEFAULT.includes(x.value)})}});
document.addEventListener("submit",async e=>{const f=e.target.closest("form.arolef");if(!f)return;e.preventDefault();if(!isOwner())return;
  const name=String(f.rn.value||"").trim().slice(0,40),perms=readBoxes(f,"rp").filter(p=>PERMS.some(x=>x[0]===p));if(!name)return;
  let id=f.dataset.role;if(!id){id=fold(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"rolle";if((ADM.roles||[]).some(x=>x.id===id))id+="-"+Date.now().toString(36).slice(-4)}
  const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"roles",id),{name,perms,at:F.serverTimestamp()});ADM.redit="";showMsg(L("Rolle gespeichert."),2500);document.activeElement&&document.activeElement.blur&&document.activeElement.blur();await admLoad()}
  catch(err){if(btn)btn.disabled=false;console.error(err);{const m=f.querySelector(".amsg");if(m){m.className="amsg";m.textContent=/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err)}}showMsg(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err),9000)}});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rdel]");if(!b||!isOwner())return;const id=b.dataset.rdel,ro=(ADM.roles||[]).find(x=>x.id===id)||{};
  if(!confirmSafe(L("Rolle «{r}» löschen? Personen mit dieser Rolle verlieren ihre Berechtigungen.").replace("{r}",ro.name||id)))return;
  try{const {F,db}=await fb();for(const em of Object.keys(ADM.ur||{}))if(ADM.ur[em]===id)await F.deleteDoc(F.doc(db,"userroles",em));await F.deleteDoc(F.doc(db,"roles",id));showMsg(L("Rolle gelöscht."),2500);await admLoad()}
  catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
document.addEventListener("change",async e=>{const sl=e.target.closest("select[data-urole]");if(!sl||!isOwner())return;const em=sl.dataset.urole,v=sl.value;if(ADMINS.includes(em))return;sl.disabled=true;
  try{const {F,db}=await fb();
    if(v==="admin"){await F.setDoc(F.doc(db,"admins",em),{addedAt:F.serverTimestamp()});if(ADM.ur[em])await F.deleteDoc(F.doc(db,"userroles",em))}
    else{if(ADM.adm.includes(em))await F.deleteDoc(F.doc(db,"admins",em));if(v)await F.setDoc(F.doc(db,"userroles",em),{role:v,at:F.serverTimestamp()});else if(ADM.ur[em])await F.deleteDoc(F.doc(db,"userroles",em))}
    showMsg(L("Rolle gespeichert."),2500);await admLoad()}
  catch(err){sl.disabled=false;console.error(err);showMsg(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err),9000);render()}});
/* user list: one compact card per person, filter chips with counts, actions folded away */
const initials=n=>String(n||"?").split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("")||"?";
function userList(rows,vis,o){
  const F=[["all","Alle"],["online","Online"],["act","Aktiv"],["inv","Eingeladen"],["off","Gesperrt"],["adm","Mit Rolle"]];
  const chips='<div class="ufil" role="group">'+F.filter(([k])=>k==="all"||ADM.cnt[k]).map(([k,t])=>'<button type="button" data-uf="'+k+'" aria-pressed="'+(ADM.uf===k)+'">'+L(t)+' <span>'+ADM.cnt[k]+'</span></button>').join("")+'</div>';
  const card=r=>{
    const own=o.own,isOwn=ADMINS.includes(r.email),cp=crewPerson(r.email)||{},open=ADM.edit===r.email||ADM.act===r.email,nm=r.name||cp.name||"";
    const badge=o.isAdm(r.email)?'<span class="ust adm">'+L(isOwn?"Besitzer:in":"Admin")+'</span>':(o.roleOf(r.email)?'<span class="ust role">'+esc(o.roleName(o.roleOf(r.email)))+'</span>':'');
    const acts=[
      o.cEd&&(own||!isOwn)?'<button data-adm="edit" data-em="'+esc(r.email)+'">✎ '+L(ADM.edit===r.email?"Schliessen":"Bearbeiten")+'</button>':'',
      own&&r.m?'<button data-adm="pwreset" data-em="'+esc(r.email)+'">'+L("Passwort-Link senden")+'</button>':'',
      own&&!r.m&&!isOwn?'<button data-adm="nomail" data-em="'+esc(r.email)+'">'+L("Ohne Bestätigungs-Mail freischalten")+'</button>':'',
      own&&!r.m&&!isOwn?'<button data-adm="startpw" data-em="'+esc(r.email)+'" data-nm="'+esc(r.name||"")+'">'+L("Startpasswort erzeugen")+'</button>':'',
      !r.m&&o.cInv?'<a class="abtnl" href="'+o.mail(r)+'">✉ '+L("Einladungsmail")+'</a>':'',
      own&&r.m&&!isOwn?(r.m.active===true?'<button class="warn" data-adm="block" data-uid="'+esc(r.m.uid)+'">'+L("Sperren")+'</button>':'<button data-adm="unblock" data-uid="'+esc(r.m.uid)+'">'+L("Entsperren")+'</button>'):'',
      isOwn?'':own&&r.m?'<button class="warn" data-adm="remove" data-uid="'+esc(r.m.uid)+'" data-em="'+esc(r.email)+'">'+L("Entfernen")+'</button>':(r.inv&&!r.m&&o.cInv?'<button class="warn" data-adm="uninvite" data-em="'+esc(r.email)+'">'+L("Einladung löschen")+'</button>':'')
    ].filter(Boolean);
    const hasActs=acts.length||(own&&!isOwn);
    return '<div class="ucard'+(r.m&&r.m.active!==true?' blocked':'')+(open?' open':'')+'">'+
      '<div class="uhd"><span class="uav'+(r.m&&isOnline(r.m)?' on':'')+'" aria-hidden="true">'+esc(initials(nm||r.email))+'</span><div class="umain"><div class="unm"><b>'+esc(nm||r.email)+'</b>'+badge+o.st(r)+'</div>'+
      '<div class="usub">'+(cp.role?esc(cp.role)+' · ':'')+'<span class="em">'+esc(r.email)+'</span>'+(r.m&&r.m.lang?' · '+esc(r.m.lang.toUpperCase()):'')+(r.m&&seenText(r.m)?' · <span class="useen'+(isOnline(r.m)?' on':'')+'">'+esc(seenText(r.m))+'</span>':'')+'</div>'+userInfo(r)+'</div>'+
      (hasActs?'<button type="button" class="umore" data-uact="'+esc(r.email)+'" aria-expanded="'+open+'" aria-label="'+esc(L("Aktionen"))+'" title="'+esc(L("Aktionen"))+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>':'')+'</div>'+
      (own&&ADM.pw&&ADM.pw[r.email]?'<div class="pwrow">'+L("Startpasswort")+': <b class="pwshow2">'+esc(ADM.pw[r.email])+'</b> <button type="button" data-pwshow="'+esc(r.email)+'">'+L("Anzeigen")+'</button></div>':'')+
      (open?'<div class="ubody">'+(own&&!isOwn?o.roleSel(r):'')+(o.cEd&&ADM.edit===r.email?editForm(r):'')+(acts.length?'<div class="aacts">'+acts.join("")+'</div>':'')+'</div>':'')+
    '</div>'};
  const SORTS=[["first","Vorname"],["name","Nachname"],["dept","Abteilung"],["status","Status"],["role","Rolle"],["new","Neueste zuerst"],["email","E-Mail"]];
  const sortSel='<label class="usort">'+L("Sortieren")+' <select data-usort>'+SORTS.map(([k,t])=>'<option value="'+k+'"'+((ADM.sort||"first")===k?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>';
  const onl=rows.filter(r=>r.m&&isOnline(r.m)).map(r=>r.name||(crewPerson(r.email)||{}).name||r.email);
  return '<div class="admins ulist"><h3>'+L("Benutzer:innen")+' <span class="ust">'+rows.length+'</span></h3>'+
    '<p class="uonline"><span class="odot" aria-hidden="true"></span>'+(onl.length?'<b>'+esc(L("Gerade aktiv"))+' ('+onl.length+'):</b> '+esc(onl.join(", ")):esc(L("Gerade ist niemand aktiv.")))+'</p>'+
    '<input class="search" id="aq" type="search" placeholder="'+esc(L("Name, E-Mail oder Funktion suchen"))+'" value="'+esc(ADM.q)+'">'+'<div class="ubar">'+chips+sortSel+'</div>'+
    (vis.length?'<div class="ucards">'+vis.map(card).join("")+'</div>':'<p class="ahint">'+L("Keine Treffer.")+'</p>')+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-uf]");if(b){ADM.uf=b.dataset.uf;render();return}
  const t=e.target.closest("[data-uact]");if(t){const em=t.dataset.uact;const was=ADM.act===em||ADM.edit===em;ADM.act=was?"":em;if(was)ADM.edit="";render()}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-dorefresh]");if(!b)return;const r=$("#refresh");if(r)r.click()});
try{ADM.sort=localStorage.getItem("usort")||"first"}catch(_){ADM.sort="first"}
document.addEventListener("change",e=>{const sl=e.target.closest("select[data-usort]");if(!sl)return;ADM.sort=sl.value;try{localStorage.setItem("usort",ADM.sort)}catch(_){}render()});
try{ADM.sub=localStorage.getItem("admsub")||"users"}catch(_){ADM.sub="users"}
document.addEventListener("click",e=>{const b=e.target.closest("[data-asub]");if(!b)return;ADM.sub=b.dataset.asub;try{localStorage.setItem("admsub",ADM.sub)}catch(_){}window.scrollTo(0,0);render()});
VIEWS.admin=function(){
  if(!canAdm())return '<div class="empty">'+L("Für die App-Verwaltung fehlt die Berechtigung «Einstellungen ändern».")+'</div>';
  if(ADM.loaded&&!ADM.busy&&!ADM.loading&&Date.now()-(ADM.at||0)>60000){ADM.loading=true;admLoad().catch(()=>{}).finally(()=>{ADM.loading=false})}
  if(!ADM.loaded){admLoad().catch(err=>{console.error(err);showMsg(L("Liste der Benutzer:innen konnte nicht geladen werden:")+" "+(err.message||err),6000)});return '<div class="empty">'+L("Lade Benutzer:innen …")+'</div>'}
  const memBy={};ADM.mem.forEach(m=>memBy[m.email]=m);
  const invBy={};ADM.inv.forEach(i=>invBy[i.id]=i);
  const rows=[];const seen=new Set();
  /* display name: crew list first, otherwise the first/last name the person entered */
  const nm=m=>{if(!m)return"";const cp=crewPerson(m.email);return (cp&&cp.name)||[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||""};
  for(const i of ADM.inv){const m=memBy[i.id];rows.push({email:i.id,name:nm(m)||i.name||"",inv:true,m});seen.add(i.id)}
  for(const m of ADM.mem)if(!seen.has(m.email))rows.push({email:m.email,name:nm(m),inv:false,m});
  /* sortable: name, first name, status, role, newest, department (crew list), e-mail */
  {const nmOf=r=>r.name||(crewPerson(r.email)||{}).name||r.email,last=r=>{const w=String(nmOf(r)).trim().split(/\s+/);return w.length>1?w[w.length-1]:w[0]};
   const stOf=r=>r.m?(r.m.active===true?0:2):1,rk=r=>ADMINS.includes(r.email)?0:ADM.adm.includes(r.email)?1:ADM.ur[r.email]?2:3;
   const ts=r=>{const j=r.m&&r.m.joinedAt;return j?(j.seconds?j.seconds*1000:Date.parse(j)||0):0};
   const dep=r=>{for(const g of S.crew)for(const p of arr(g.people))if(lc(p.email)===r.email)return g.dept||"";return "~"};
   const by={name:(a,b)=>String(last(a)).localeCompare(last(b),LANG)||String(nmOf(a)).localeCompare(nmOf(b),LANG),first:(a,b)=>String(nmOf(a)).localeCompare(nmOf(b),LANG),status:(a,b)=>stOf(a)-stOf(b),role:(a,b)=>rk(a)-rk(b),new:(a,b)=>ts(b)-ts(a),dept:(a,b)=>dep(a).localeCompare(dep(b),LANG),email:(a,b)=>a.email.localeCompare(b.email)};
   const f=by[ADM.sort]||by.first;rows.sort((a,b)=>f(a,b)||by.first(a,b))}
  const q=lc(ADM.q);const UF={online:r=>!!r.m&&isOnline(r.m),all:()=>true,act:r=>r.m&&r.m.active===true,inv:r=>!r.m,off:r=>r.m&&r.m.active!==true,adm:r=>ADMINS.includes(r.email)||ADM.adm.includes(r.email)||!!ADM.ur[r.email]};
  if(!UF[ADM.uf])ADM.uf="all";
  const vis=rows.filter(r=>(!q||(r.email+" "+r.name+" "+((crewPerson(r.email)||{}).role||"")).toLowerCase().includes(q))&&UF[ADM.uf](r));
  ADM.cnt=Object.fromEntries(Object.keys(UF).map(k=>[k,rows.filter(UF[k]).length]));
  const newCrew=crewEmails().filter(c=>!invBy[c.email]&&!memBy[c.email]);
  const st=r=>r.m?(r.m.active===true?'<span class="ust ok">'+(LANG==="de"?"aktiv":L("aktiv_1"))+'</span>':'<span class="ust off">'+L("gesperrt")+'</span>'):'<span class="ust wait">'+L("eingeladen")+'</span>';
  const site=location.origin+location.pathname;
  const mail=r=>mailto(r.email,"invite",{vorname:String(r.name||(crewPerson(r.email)||{}).name||"").split(/\s+/)[0],name:r.name||""});
  const own=isOwner();const isAdm=e=>ADMINS.includes(e)||ADM.adm.includes(e);
  const admSec=own?'<div class="admins"><h3>'+L("Administrator:innen")+'</h3><p class="ahint">'+L("Administrator:innen können Leute einladen und sehen in der Crew Essen und Geburtstage. Sperren und Entfernen kannst nur du. Admins und andere Rollen weist du unten bei der Person unter «Rolle» zu.")+'</p>'+
    '<div class="arow"><span>'+esc(ADMINS[0])+'</span><span class="ust ok">'+L("Besitzer:in")+'</span></div>'+
    ADM.adm.map(e=>[e,((rows.find(r=>r.email===e)||{}).name)||(crewPerson(e)||{}).name||""]).sort((a,b)=>(a[1]||a[0]).localeCompare(b[1]||b[0],LANG)).map(([e,n])=>'<div class="arow"><span>'+esc(n||e)+'</span><button data-adm="rmadmin" data-em="'+esc(e)+'">'+L("Entfernen")+'</button></div>').join("")+
    '</div>':'';
  const setSec=can("settings")?'<div class="admins asetd"><h3>'+L("Einstellungen der App")+'</h3><form class="alangs" data-adm="langs"><p class="ahint"><b>'+L("Sprachen")+'</b> – '+L("Nur diese Sprachen stehen in der App zur Auswahl. Mindestens eine.")+'</p><div class="chk">'+LANGS.map(([k,t])=>'<label class="ck"><input type="checkbox" name="al" value="'+k+'"'+(APPLANGS.includes(k)?' checked':'')+'> '+t+'</label>').join("")+'</div>'+
    '<p class="ahint"><b>'+L("Bereiche")+'</b> – '+L("Nur die gewählten Bereiche erscheinen unten in der App. Mindestens einer.")+' '+L("Reihenfolge mit ▲ ▼ ändern.")+'</p><div class="tbord">'+tabOrder().map(k=>[k,{plan:"Schedule",dispo:"Callsheet",loc:"Locations",crew:"Crew",script:"Script",info:"Info"}[k]]).map(([k,t])=>'<div class="tbrow"><label class="ck"><input type="checkbox" name="tb" value="'+k+'"'+(!Array.isArray(window.TABSON)||window.TABSON.includes(k)?' checked':'')+'> '+t+'</label><span class="tbmv"><button type="button" data-tmv="up" aria-label="'+esc(L("Nach oben"))+'">▲</button><button type="button" data-tmv="down" aria-label="'+esc(L("Nach unten"))+'">▼</button></span></div>').join("")+'</div>'+
    '<p class="ahint"><b>Units</b> – '+L("Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.")+'</p><div class="chk"><label class="ck"><input type="checkbox" name="u2"'+(window.UNIT2!==false?' checked':'')+'> '+L("2nd Unit anzeigen")+'</label><label class="ck"><input type="checkbox" name="u3"'+(window.UNIT3===true?' checked':'')+'> '+L("3rd Unit anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Geburtstage")+'</b> – '+L("Eingeschaltet sehen alle Benutzer:innen in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).")+'</p><div class="chk"><label class="ck"><input type="checkbox" name="bp"'+(window.BDAYPUB===true?' checked':'')+'> '+L("Geburtstagsliste allen anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Anmeldung")+'</b> – '+L("Ausgeschaltet verschwindet «Mit Google anmelden» auf der Anmeldeseite. Wer schon mit Google angemeldet ist, bleibt angemeldet.")+'</p><div class="chk"><label class="ck"><input type="checkbox" name="go"'+(window.GOOGLEON!==false?' checked':'')+'> '+L("Mit Google anmelden anbieten")+'</label></div>'+
    '<p class="ahint"><b>'+L("Benutzer:innen ohne Rolle")+'</b> – '+L("Was Personen ohne Rolle sehen. Ausgeschaltet sehen es nur Personen, deren Rolle es erlaubt.")+'</p><div class="chk">'+
      [["pp","phone","Telefonnummern"],["pe","email","E-Mail-Adressen"],["pm","mycal","Meine Termine"]].map(([n,k,t])=>'<label class="ck"><input type="checkbox" name="'+n+'"'+(window.PUBV[k]!==false?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>'+
    '<p class="ahint"><b>Dropbox</b> – '+L("Eingeschaltet werden Drehplan, Drehbuch, Crewliste, Callsheets und Motivliste jede Stunde automatisch neu geladen (nur gelesen).")+'</p><div class="chk"><label class="ck"><input type="checkbox" name="au"'+(window.AUTOUPD!==false?' checked':'')+'> '+L("Daten aus der Dropbox automatisch laden")+'</label></div>'+
    '<p class="ahint"><b>'+L("Drehbuch")+'</b> – '+L("Eingeschaltet erscheint bei jeder Szene der Knopf «Script», der die Szene im Drehbuch öffnet.")+'</p><div class="chk"><label class="ck"><input type="checkbox" name="so"'+(window.SCRIPTON!==false?' checked':'')+'> '+L("Drehbuch anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Motivliste")+'</b> – '+L("Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.")+'</p><input class="amap" type="url" name="sheet" inputmode="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(window.LOCSHEET||"")+'">'+
    '<p class="ahint"><b>'+L("Karte")+'</b> – '+L("Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.")+'</p><input class="amap" type="url" name="map" inputmode="url" placeholder="https://www.google.com/maps/d/…" value="'+esc(window.MAPURL||"")+'"><button type="submit">'+L("Speichern")+'</button></form></div>':'';
  const SUBS=[];if(can("users.view")||can("users.invite")||can("users.requests")||can("users.edit"))SUBS.push(["users","Benutzerverwaltung"]);if(own)SUBS.push(["roles","Rollen"],["bk","Backup"]);if(can("settings"))SUBS.push(["set","Einstellungen"]);
  if(!SUBS.length)return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!SUBS.some(x=>x[0]===ADM.sub))ADM.sub=SUBS[0][0];
  const subNav=SUBS.length>1?'<nav class="asub n'+SUBS.length+'" role="tablist">'+SUBS.map(([k,t])=>'<button type="button" role="tab" data-asub="'+k+'" aria-selected="'+(ADM.sub===k)+'">'+(t==="Benutzerverwaltung"?'<span class="lgl">'+esc(L(t))+'</span><span class="sml">'+esc(L("Benutzer"))+'</span>':esc(L(t)))+'</button>').join("")+'</nav>':'';
  let h='<section class="adm"><h2 class="dh">'+L("App-Verwaltung")+'</h2>'+subNav;
  if(ADM.sub==="set")return h+'<div class="setbar"><button type="button" class="pillbtn" data-dorefresh><span aria-hidden="true">↻</span> '+L("Daten jetzt aktualisieren")+'</button></div>'+(own?upSec().replace(/<details([^>]*data-sec="upsec")(?![^>]*\bopen)/,'<details$1 open'):'')+setSec+docsSec()+'</section>';
  if(ADM.sub==="roles")return h+rolesSec()+'</section>';
  if(ADM.sub==="bk")return h+bkSec().replace(' data-sec="backup"',' data-sec="backup" open')+'</section>';
  const cInv=can("users.invite"),cView=can("users.view")||can("users.edit"),cEd=can("users.edit");
  h+=(can("users.requests")?reqSec():'')+admSec+(!cInv?'':
    '<div class="admins"><h3>'+L("Benutzer:innen einladen")+'</h3><p class="ahint">'+L("Nur eingeladene Adressen können ein Konto erstellen (E-Mail/Passwort oder Google). Gesperrte oder entfernte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.")+'</p>'+
    '<form class="aform" data-adm="add"><input name="em" type="email" placeholder="'+esc(L("E-Mail-Adresse"))+'" required><input name="nm" type="text" placeholder="'+esc(L("Name (optional)"))+'"><button type="submit">'+L("Einladen")+'</button></form>'+
    (newCrew.length?'<button class="abtn" data-adm="crew">'+esc(L("Alle {n} Adressen aus der Crewliste einladen").replace("{n}",newCrew.length))+'</button>':'')+'</div>')+(!cView?'':userList(rows,vis,{own,cInv,cEd,isAdm,roleOf,roleName,roleSel,st,mail}))+'</section>';
  return h;
};
document.addEventListener("input",e=>{if(e.target.id==="aq"){ADM.q=e.target.value;const p=e.target.selectionStart;render();const i=$("#aq");if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener("submit",async e=>{
  const sf=e.target.closest('[data-adm="save"]');if(sf){e.preventDefault();if(!can("users.edit"))return;
    const em=sf.dataset.em,g=n=>{const x=sf.querySelector('[name="'+n+'"]');return x?String(x.value||"").trim():null};
    const m=ADM.mem.find(x=>x.email===em),inv=ADM.inv.find(x=>x.id===em),btn=sf.querySelector("button");if(btn)btn.disabled=true;
    try{const {F,db}=await fb();
      if(m){const fn=g("fn"),ln=g("ln"),d={firstName:fn,lastName:ln,name:[fn,ln].filter(Boolean).join(" ")||m.name||"",lang:g("lg")||m.lang||"de",birthday:g("bd")||"",gender:g("gd")||"",phone:(g("eph")||"").slice(0,40),contactEmail:lc(g("ece")||"").slice(0,120),diet:g("edt")||"none",intol:readBoxes(sf,"eint"),allergies:(g("eal")||"").slice(0,200)};
        await F.updateDoc(F.doc(db,"members",m.uid),d)}
      if(inv||!m){const d={name:(m?[g("fn"),g("ln")].filter(Boolean).join(" "):g("nm"))||"",role:g("rl")||""};
        if(inv)await F.updateDoc(F.doc(db,"invites",em),d);else await F.setDoc(F.doc(db,"invites",em),Object.assign(d,{addedAt:F.serverTimestamp()}))}
      else if(g("rl"))await F.setDoc(F.doc(db,"invites",em),{name:[g("fn"),g("ln")].filter(Boolean).join(" "),role:g("rl"),addedAt:F.serverTimestamp()});
      ADM.edit="";ADM.cedit="";showMsg(L("Gespeichert."),3000);await admLoad();render()}
    catch(err){console.error(err);if(btn)btn.disabled=false;showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const fl=e.target.closest('[data-adm="langs"]');
  if(fl){e.preventDefault();if(!can("settings"))return;const l=[...fl.querySelectorAll('input[name=al]:checked')].map(x=>x.value);
    if(!l.length){showMsg(L("Bitte mindestens eine Sprache wählen."),4000);return}
    const tb=[...fl.querySelectorAll('input[name=tb]:checked')].map(x=>x.value),tord=[...fl.querySelectorAll('input[name=tb]')].map(x=>x.value);
    if(!tb.length){showMsg(L("Bitte mindestens einen Bereich wählen."),4000);return}
    try{const {F,db}=await fb();const u2=!!fl.querySelector('input[name=u2]').checked,u3=!!fl.querySelector('input[name=u3]').checked,bp=!!fl.querySelector('input[name=bp]').checked,so=!!fl.querySelector('input[name=so]').checked,au=!!fl.querySelector('input[name=au]').checked;const mu=String(fl.querySelector('input[name=map]').value||"").trim();
    if(mu&&!/^https:\/\/\S+$/.test(mu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const sh=String(fl.querySelector('input[name=sheet]').value||"").trim();
    if(sh&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(sh)){showMsg(L("Bitte einen Google-Sheets-Link eingeben."),4000);return}
    await F.setDoc(F.doc(db,"config","app"),{langs:l,unit2:u2,unit3:u3,mapUrl:mu,bdayPublic:bp,phonePublic:!!(fl.querySelector('input[name=pp]')||{}).checked,emailPublic:!!(fl.querySelector('input[name=pe]')||{}).checked,mycalPublic:!!(fl.querySelector('input[name=pm]')||{}).checked,googleLogin:!!(fl.querySelector('input[name=go]')||{}).checked,locSheet:sh,script:so,tabs:tb,tabOrder:tord,autoUpdate:au},{merge:true});window.TABORDER=tord;try{localStorage.setItem("apptaborder",JSON.stringify(tord))}catch(_){}window.AUTOUPD=au;try{localStorage.setItem("appauto",au?"1":"0")}catch(_){}window.TABSON=tb;try{localStorage.setItem("apptabs",JSON.stringify(tb))}catch(_){}window.SCRIPTON=so;try{localStorage.setItem("appscript",so?"1":"0")}catch(_){}window.LOCSHEET=sh;APPLANGS=l;window.UNIT2=u2;window.UNIT3=u3;window.BDAYPUB=bp;if(bp)syncBdays(true);try{localStorage.setItem("appbdaypub",bp?"1":"0")}catch(_){}window.MAPURL=mu;try{localStorage.setItem("applangs",JSON.stringify(l));localStorage.setItem("appunit2",u2?"1":"0");localStorage.setItem("appunit3",u3?"1":"0");localStorage.setItem("appmap",mu)}catch(_){}applyLangs();render();showMsg(L("Einstellungen gespeichert."),3000)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const f=e.target.closest('[data-adm="add"]');if(!f)return;e.preventDefault();
  const em=lc(f.em.value),nm=f.nm.value.trim();if(!/@/.test(em))return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"invites",em),{name:nm,addedAt:F.serverTimestamp()});showMsg(em+" "+L("eingeladen."),3000);await admLoad()}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
});
document.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-adm]");if(!b||ADM.busy)return;ADM.busy=true;
  try{
    const {F,db}=await fb();const a=b.dataset.adm;
    if(a==="edit"){ADM.edit=ADM.edit===b.dataset.em?"":b.dataset.em;ADM.busy=false;render();return}
    /* passwords can only be set by the person: send Firebase's reset link, which lets them choose a new one */
    if(a==="startpw"){ADM.busy=false;if(!isOwner())return;const em=b.dataset.em;
      if(!confirmSafe(L("Für {e} ein Konto mit Startpasswort anlegen? Beim ersten Anmelden muss die Person ein eigenes Passwort festlegen.").replace("{e}",em)))return;
      b.disabled=true;try{const pw=await createStartAccount(em,b.dataset.nm||"");ADM.pw=ADM.pw||{};ADM.pw[em]=pw;showStartPw(em,b.dataset.nm||"",pw);await admLoad()}
      catch(err){b.disabled=false;const c=err&&err.code||"";showMsg(/email-already-in-use/.test(c)?em+" "+L("hat schon ein Konto – dafür «Passwort-Link senden» verwenden."):/permission/.test(c)?L("Keine Berechtigung – bitte die neuen Firestore-Regeln in Firebase veröffentlichen."):L("Fehler:")+" "+errText(err),9000)}
      return}
    if(a==="nomail"){ADM.busy=false;if(!isOwner())return;const em=lc(b.dataset.em);
      if(!confirmSafe(L("{e} ohne Bestätigungs-Mail freischalten? Nur machen, wenn die Adresse sicher dieser Person gehört.").replace("{e}",em)))return;
      await F.setDoc(F.doc(db,"starts",em),{mustChange:false,at:F.serverTimestamp()});
      if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:"",role:"",addedAt:F.serverTimestamp()});
      showMsg(em+" "+L("ist freigeschaltet. Die Person meldet sich einfach an – oder tippt auf «Ich habe bestätigt»."),7000);await admLoad();return}
    if(a==="pwreset"){ADM.busy=false;if(!isOwner())return;const em=b.dataset.em;
      if(!confirmSafe(L("{e} einen Link schicken, mit dem die Person ein neues Passwort festlegt?").replace("{e}",em)))return;
      const {A,auth}=await fb();await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),em);
      showMsg(L("Link für ein neues Passwort gesendet an")+" "+em+". "+L("Schau auch im Spam-Ordner nach."),6000);return}
    if(a==="reqok"||a==="reqno"){const em=b.dataset.em,q=(ADM.req||[]).find(x=>x.id===em)||{};
      if(a==="reqok"){await F.setDoc(F.doc(db,"invites",em),{name:String(q.name||"").slice(0,80),role:String(q.role||"").slice(0,80),addedAt:F.serverTimestamp()});await notifyApproved(em,q)}
      await F.deleteDoc(F.doc(db,"requests",em));ADM.req=(ADM.req||[]).filter(x=>x.id!==em);
      showMsg(a==="reqok"?L("Freigeschaltet:")+" "+(q.name||em):L("Anfrage abgelehnt."),4000);ADM.busy=false;await admLoad();return}
    if(a==="crew"){const list=crewEmails().filter(c=>!ADM.inv.some(i=>i.id===c.email)&&!ADM.mem.some(m=>m.email===c.email));
      if(confirmSafe(L("{n} Adressen aus der Crewliste einladen?").replace("{n}",list.length))){
        for(let i=0;i<list.length;i+=400){const batch=F.writeBatch(db);list.slice(i,i+400).forEach(c=>batch.set(F.doc(db,"invites",c.email),{name:c.name,role:c.role,addedAt:F.serverTimestamp()}));await batch.commit()}
        showMsg(L("{n} Adressen eingeladen.").replace("{n}",list.length),4000)}}
    else if((a==="block"||a==="remove"||a==="uninvite")&&ADMINS.includes(b.dataset.em||(ADM.mem.find(m=>m.uid===b.dataset.uid)||{}).email)){showMsg(L("Die Besitzerin oder der Besitzer kann nicht gesperrt oder entfernt werden."),4000)}
    else if(a==="block"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:false});showMsg(L("Gesperrt."),3000)}
    else if(a==="unblock"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:true});showMsg(L("Entsperrt."),3000)}
    else if(a==="remove"){if(confirmSafe(L("{e} entfernen? Die Person kommt danach nicht mehr in die App.").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"invites",b.dataset.em)).catch(()=>{});await F.deleteDoc(F.doc(db,"members",b.dataset.uid));showMsg(L("Entfernt."),3000)}}
    else if(a==="mkadmin"&&isOwner()){await F.setDoc(F.doc(db,"admins",b.dataset.em),{addedAt:F.serverTimestamp()});showMsg(b.dataset.em+" "+L("ist jetzt Admin."),3000)}
    else if(a==="rmadmin"&&isOwner()){if(confirmSafe(L("{e} die Admin-Rechte entziehen?").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"admins",b.dataset.em));showMsg(L("Admin-Rechte entzogen."),3000)}}
    else if(a==="uninvite"){await F.deleteDoc(F.doc(db,"invites",b.dataset.em));showMsg(L("Einladung gelöscht."),3000)}
    await admLoad();
  }catch(err){console.error(err);showMsg(L("Fehler:")+" "+(err.message||err),6000)}
  ADM.busy=false;
});
/* Crew tab: admins see food preferences next to each person (matched by e-mail) */
/* Crew tab (admins only): toggles for food preferences and birthdays */
/* food + birthdays are on by default for admins; the choice is remembered (v2 keys reset older "off" states) */
const ADMV={food:true,bday:true,acct:true};try{for(const k in ADMV){const v=localStorage.getItem("admv2:"+k);if(v!==null)ADMV[k]=v==="1"}}catch(_){}
const ensureAdm=()=>{if(!ADM.loaded&&!ADM.busy&&!ADM.loading&&!ADM.err){ADM.loading=true;admLoad().then(()=>{ADM.err=""}).catch(err=>{console.error(err);ADM.err=String((err&&(err.code||err.message))||err);render()}).finally(()=>{ADM.loading=false})}};
/* crew entry -> member: same e-mail, otherwise same first + last name */
const nkey=t=>String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z]+/g," ").trim();
/* lookup tables built once per admin load instead of searching all members for every crew row */
const AIX={byEmail:new Map(),byName:new Map(),dept:new Map(),mem:null,crew:null};
const aix=()=>{if(AIX.mem!==ADM.mem||AIX.crew!==S.crew)admIndex();return AIX};
function admIndex(){
  AIX.mem=ADM.mem;AIX.crew=S.crew;AIX.byEmail=new Map();AIX.byName=new Map();AIX.dept=new Map();
  for(const m of ADM.mem){if(m.email)AIX.byEmail.set(m.email,m);for(const k of [nkey([m.firstName,m.lastName].filter(Boolean).join(" ")),nkey(m.name)])if(k&&!AIX.byName.has(k))AIX.byName.set(k,m)}
  for(const g of S.crew)for(const p of (g.people||[])){const e=lc(p.email),k=nkey(p.name);if(e&&!AIX.dept.has("e:"+e))AIX.dept.set("e:"+e,g.dept||"");if(k&&!AIX.dept.has("n:"+k))AIX.dept.set("n:"+k,g.dept||"")}
}
function memberFor(p){
  const x=aix(),e=lc(p.email);return (e&&x.byEmail.get(e))||x.byName.get(nkey(p.name))||null;
}
const bdShort=iso=>{const m=/^\d{4}-(\d\d)-(\d\d)$/.exec(iso||"");return m?m[2]+"."+m[1]+".":""};
function bdayEntries(){
  const name=m=>[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||(crewPerson(m.email)||{}).name||m.email;
  if(isAdmin()&&ADM.loaded)return ADM.mem.filter(m=>m.active===true&&/^\d{4}-\d\d-\d\d$/.test(m.birthday||"")).map(m=>({name:name(m),md:m.birthday.slice(5)}));
  return PUBB.list;
}
function bdayHTML(){
  const ds=S.days.map(d=>d.date).filter(Boolean).sort();if(!ds.length)return"";
  const y=ds[0].slice(0,4),from=ds[0].slice(5),to=ds[ds.length-1].slice(5);
  const hits=bdayEntries().filter(x=>/^\d\d-\d\d$/.test(x.md||"")&&x.md>=from&&x.md<=to).sort((a,b)=>a.md<b.md?-1:a.md>b.md?1:String(a.name).localeCompare(String(b.name)));
  return secOpen("bcal",L("Geburtstage während des Drehs")+(hits.length?" · "+hits.length:""),(hits.length?hits.map(x=>{const d=new Date(y+"-"+x.md+"T12:00:00");return '<div class="bl"><span>'+esc(WD[d.getDay()]+" "+pad2(d.getDate())+"."+pad2(d.getMonth()+1)+".")+'</span><b>'+esc(x.name)+'</b></div>'}).join(""):'<p class="ghint">'+esc(L("Keine Geburtstage während des Drehs."))+'</p>'));
}
/* birthday list for everyone (when the main admin allows it): bdays/{uid} = {name, md "MM-DD"}; no year, no other data */
const PUBB={list:[],loaded:false,loading:false};
async function loadPubBdays(){
  if(PUBB.loading)return;PUBB.loading=true;
  try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"bdays"));PUBB.list=q.docs.map(d=>d.data()).filter(x=>x&&x.md);PUBB.loaded=true;render()}
  catch(err){console.warn("bdays",err);PUBB.loaded=true;setTimeout(()=>{PUBB.loaded=false},60000)}
  PUBB.loading=false;
}
async function writeOwnBday(name,birthday){
  try{const {F,db}=await fb();const ref=F.doc(db,"bdays",ME.uid);
    if(/^\d{4}-\d\d-\d\d$/.test(birthday||""))await F.setDoc(ref,{name:name||"",md:birthday.slice(5)});else await F.deleteDoc(ref).catch(()=>{});
    PUBB.loaded=false;
  }catch(err){console.warn("bday write",err)}
}
/* main admin: keep bdays/ in line with active members (also fills it for people who registered earlier) */
let BSYNC=0;
async function syncBdays(force){
  if(!isOwner()||!ADM.loaded||(!force&&Date.now()-BSYNC<10*60*1000))return;BSYNC=Date.now();
  try{const {F,db}=await fb();const cur=await F.getDocs(F.collection(db,"bdays"));const have={};cur.docs.forEach(d=>have[d.id]=d.data());
    const name=m=>[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||(crewPerson(m.email)||{}).name||"";
    const want={};ADM.mem.forEach(m=>{if(m.active===true&&/^\d{4}-\d\d-\d\d$/.test(m.birthday||""))want[m.uid]={name:name(m),md:m.birthday.slice(5)}});
    const ops=[];for(const id in want)if(!have[id]||have[id].name!==want[id].name||have[id].md!==want[id].md)ops.push(["set",id,want[id]]);
    for(const id in have)if(!want[id])ops.push(["del",id]);
    for(let i=0;i<ops.length;i+=400){const b=F.writeBatch(db);ops.slice(i,i+400).forEach(o=>o[0]==="set"?b.set(F.doc(db,"bdays",o[1]),o[2]):b.delete(F.doc(db,"bdays",o[1])));await b.commit()}
  }catch(err){console.warn("bday sync",err)}
}
const ICO={acct:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6 1.6 0 3 .5 4.1 1.3M15.5 17.5l2 2 4-4.5"/>',bcal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13.5c-.7-.7-.7-1.6 0-2.3.7.7.7 1.6 0 2.3zM12 14v3"/>',food:'<path d="M7 2v8M4 2v5a3 3 0 0 0 6 0V2M7 10v12M17 2c-2 1.5-3 4-3 7h3v13"/>',bday:'<path d="M4 21h16M5 21v-8h14v8M12 13V9M12 6.5c-1-1-1-2.5 0-3.5 1 1 1 2.5 0 3.5zM5 16c2.3 1.5 4.7 1.5 7 0s4.7-1.5 7 0"/>'};
const togBtn=(k,t)=>'<button type="button" class="foodtog ico" data-admv="'+k+'" aria-pressed="'+ADMV[k]+'" aria-label="'+esc(L(t))+'" title="'+esc(L(t))+'"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+ICO[k]+'</svg></button>';
const AV=k=>!!ADMV[k]&&can(k==="food"?"crew.food":k==="bday"?"crew.bday":"users.view");
window.crewHead=function(){
  if(!(can("crew.food")||can("crew.bday")||can("crew.vcf")||can("users.edit"))){if(!window.BDAYPUB||!ME)return"";if(!PUBB.loaded)loadPubBdays();return PUBB.loaded?bdayHTML():""}
  ensureAdm();
  return '<div class="admv">'+(can("crew.food")?togBtn("food","Essen"):"")+(ADM.err?'<span class="admerr">'+L("Daten der Benutzer:innen nicht lesbar")+' ('+esc(ADM.err)+') – '+L("Firestore-Regeln prüfen.")+'</span>':'')+(can("crew.bday")?togBtn("bday","Geburtstage"):"")+(isOwner()||can("users.edit")?togBtn("acct","Kontoinfos"):"")+(!can("crew.vcf")?"":'<button type="button" class="foodtog ico vcall" data-vcall aria-label="'+esc(L("Alle Kontakte als VCF"))+'" title="'+esc(L("Alle Kontakte als VCF"))+'"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5 1.3 0 2.5.4 3.4 1M15 3v10M11.5 9.5 15 13l3.5-3.5M11 20h9"/></svg><b>VCF</b></button>')+'</div>'+(ADM.loaded?(can("crew.bday")?bdayHTML():"")+(can("crew.food")?cateringHTML():""):"");
};
document.addEventListener("click",e=>{if(!e.target.closest("[data-vcall]")||!can("crew.vcf"))return;const {text,n}=allVCards();if(!n)return;saveVcf(text,"TSCHUGGER Tigerblood Crew");showMsg(n+" "+L("Kontakte als VCF gespeichert."),4000)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-admv]");if(!b)return;const k=b.dataset.admv;ADMV[k]=!ADMV[k];ADM.err="";if(ADMV[k]&&!ADM.loading&&Date.now()-(ADM.at||0)>60000)ADM.loaded=false;try{localStorage.setItem("admv2:"+k,ADMV[k]?"1":"0")}catch(_){}render()});
/* main admin: invite a crew member as app user straight from the crew list (shown with «Kontostatus») */
document.addEventListener("click",async e=>{const b=e.target.closest("[data-cinv]");if(!b||!isOwner())return;e.preventDefault();e.stopPropagation();
  const em=lc(b.dataset.cinv);b.disabled=true;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"invites",em),{name:String(b.dataset.nm||"").slice(0,80),role:String(b.dataset.rl||"").slice(0,80),addedAt:F.serverTimestamp()});
    if(!ADM.inv.some(i=>i.id===em))ADM.inv.push({id:em,name:b.dataset.nm||""});admIndex();render();
    showMsg((b.dataset.nm||em)+" "+L("ist jetzt als Benutzer:in freigeschaltet und kann ein Konto erstellen."),4000)}
  catch(err){b.disabled=false;showMsg(L("Fehler:")+" "+(err.message||err),6000)}},true);
/* invitation mail to an invited crew member, from the admin's own mail program (arrives more reliably than system mail) */
document.addEventListener("click",e=>{const b=e.target.closest("[data-cmail]");if(!b||!isAdmin())return;e.preventDefault();e.stopPropagation();
  const em=b.dataset.cmail;location.href=mailto(em,"invite",{vorname:(b.dataset.nm||"").split(/\s+/)[0],name:b.dataset.nm||""})},true);
/* blocking gallery: encrypted preview images (blk/*.bin = 12-byte IV + AES-GCM), decrypted with the crew key */
const BLKIMG=new Map();
window.blkImg=function(f){
  if(!BLKIMG.has(f))BLKIMG.set(f,(async()=>{const key=await getDataKey();const r=await fetch(f,{cache:"force-cache"});if(!r.ok)throw new Error("HTTP "+r.status);
    const buf=new Uint8Array(await r.arrayBuffer());const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:buf.slice(0,12)},key,buf.slice(12));
    return URL.createObjectURL(new Blob([pt],{type:/\.mp4\.bin$/.test(f)?"video/mp4":"image/jpeg"}))})().catch(err=>{BLKIMG.delete(f);throw err}));
  return BLKIMG.get(f);
};
/* crew list: phone / e-mail from the app profile when the crew list has none (people allowed to see contacts outside the crew list) */
window.crewFill=function(p){
  if(!ME||!(can("contacts.extra")||can("users.view")))return null;
  if(!ADM.loaded){ensureAdm();return null}
  const m=memberFor(p);if(!m)return null;
  return {phone:String(m.phone||"").trim(),email:String(m.contactEmail||m.email||"").trim()};
};
window.crewExtra=function(p){
  /* «Kontoinfos» (owner and everyone allowed to change user data): account status, edit user data, role */
  const ACC=ADMV.acct&&(isOwner()||can("users.edit"));
  if(!p||!(can("crew.food")||can("crew.bday")||can("users.edit")))return"";
  if(!ADM.loaded){ensureAdm();return ADM.err||!(AV("food")||AV("bday")||ACC)?"":'<div class="pinfo"><span class="na">…</span></div>'}
  const m=memberFor(p),ch=[],na=t=>'<span class="na">'+esc(t)+'</span>';
  /* admins edit the person's user data right here (same form as in App-Verwaltung) */
  const ue=m?m.email:lc(p.email),uinv=ue&&ADM.inv.some(i=>i.id===ue),canEd=ACC&&can("users.edit")&&(m||uinv)&&(isOwner()||!ADMINS.includes(ue));
  const edBtn=canEd?'<button type="button" class="cinv ced" data-ced="'+esc(ue)+'" aria-expanded="'+(ADM.cedit===ue)+'">✎ '+esc(L(ADM.cedit===ue?"Schliessen":"Benutzerdaten bearbeiten"))+'</button>':"";
  const edForm=canEd&&ADM.cedit===ue?editForm({email:ue,m,name:p.name,role:p.role},false):"";
  const rSel=ACC&&isOwner()&&(m||uinv)&&!ADMINS.includes(ue)?roleSel({email:ue}):"";
  if(!(AV("food")||AV("bday")||ACC))return "";
  if(ACC){
    if(!m){const e=lc(p.email),inv=e&&ADM.inv.some(i=>i.id===e);ch.push(na(L(inv?"Eingeladen, noch kein Konto":"Noch kein Konto")));
      if(inv&&isAdmin())ch.push('<button type="button" class="cinv" data-cmail="'+esc(e)+'" data-nm="'+esc(p.name||"")+'">✉ '+esc(L("Einladungs-Mail schicken"))+'</button>');
      if(!inv&&isOwner()&&e&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))ch.push('<button type="button" class="cinv" data-cinv="'+esc(e)+'" data-nm="'+esc(p.name||"")+'" data-rl="'+esc(p.role||"")+'">+ '+esc(L("Als Benutzer:in einladen"))+'</button>')}
    else ch.push(m.active===true?'<span class="ok">'+esc(L("Konto aktiv"))+'</span>':'<span class="off">'+esc(L("Gesperrt"))+'</span>');
    const ems=[lc(p.email),m&&m.email].filter(Boolean);
    if(ems.some(e=>ADMINS.includes(e)))ch.push('<span class="adm">'+esc(L("Besitzer:in"))+'</span>');
    else if(ems.some(e=>ADM.adm.includes(e)))ch.push('<span class="adm">'+esc(L("Admin"))+'</span>');
  }
  if(m&&AV("bday")){const b=bdShort(m.birthday);ch.push(b?'<span class="bday">'+esc(L("Geburtstag"))+' '+esc(b)+'</span>':(ACC?na(L("Geburtstag")+": –"):""))}
  if(m&&AV("food")){const t=dietText(m);ch.push(t?'<span class="diet">'+esc(t)+'</span>':(m.diet?"":(ACC?na(L("Essen")+": "+L("keine Angaben")):"")))}
  if(edBtn)ch.push(edBtn);if(rSel)ch.push(rSel);
  const h=ch.filter(Boolean).join("");return (h?'<div class="pinfo">'+h+'</div>':"")+edForm;
};
document.addEventListener("click",e=>{const b=e.target.closest("[data-ced]");if(!b||!can("users.edit"))return;e.preventDefault();e.stopPropagation();ADM.cedit=ADM.cedit===b.dataset.ced?"":b.dataset.ced;render()},true);


function confirmSafe(t){try{return window.confirm(t)}catch(_){return true}}

/* ---------- new app version: reload once when the published version differs ---------- */
const APP_VER="__APP_VER__";
async function checkVersion(){
  try{const r=await fetch("version.txt?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const v=(await r.text()).trim();
    if(!v||v===APP_VER)return;
    let done="";try{done=sessionStorage.getItem("reloadedFor")||""}catch(_){}
    if(done===v)return;try{sessionStorage.setItem("reloadedFor",v)}catch(_){}
    if(document.querySelector("#acct:not([hidden]) form input:focus,#gate:not([hidden]) input:focus"))return;
    location.reload();
  }catch(_){}
}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkVersion()});
setTimeout(checkVersion,1500);
/* ---------- safety net: errors never leave a blank screen ---------- */
window.addEventListener("unhandledrejection",e=>{console.warn("unhandled",e.reason)});
window.addEventListener("error",e=>{console.warn("error",e.message);try{if(!document.getElementById("view").innerHTML.trim())render()}catch(_){}});
/* ---------- start ---------- */
applyStatic();
loadCache();
render();
(async()=>{
  const b=$("#refresh");b.hidden=false;
  b.addEventListener("click",async()=>{
    if(b.classList.contains("spin"))return;b.classList.add("spin");
    try{SCRIPT=null;MEMO.clear();
      if(await load(true)){const c=lastCheck(S.meta);render();showMsg(L("Neueste Daten geladen.")+(c?" "+L("Dropbox zuletzt geprüft")+" "+fmtStamp(c)+".":"")+(window.AUTOUPD!==false?" "+L("Die Daten werden jede Stunde automatisch aus der Dropbox geladen."):""),7000)}
      else showMsg(L("Bitte zuerst anmelden."),5000)}
    catch(err){console.error(err);showMsg(isOffline(err)&&S.days.length?L("Offline – du siehst den zuletzt geladenen Stand."):loadErr(err),6000)}
    setTimeout(()=>b.classList.remove("spin"),400);
  });
  applyLangs();
  if(!S.loaded&&!S.days.length)showGate("wait");
  loadLangs();
  try{
    const {A,auth}=await fb();
    await A.setPersistence(auth,A.browserLocalPersistence).catch(()=>{});
    A.getRedirectResult(auth).catch(err=>{console.error(err);showGate("login",errText(err),true)});
    if(typeof A.isSignInWithEmailLink==="function"&&A.isSignInWithEmailLink(auth,location.href)){
      const q=new URLSearchParams(location.search);let em=q.get("em")||"";try{em=em||localStorage.getItem("emailForSignIn")||""}catch(_){}
      if(!em)em=(prompt(L("Bitte bestätige deine E-Mail-Adresse:"))||"").trim();
      if(em){window.__justSignedIn=true;if(window.resetViewState)window.resetViewState();A.signInWithEmailLink(auth,em,location.href).then(()=>history.replaceState(null,"",location.pathname)).catch(err=>{console.error(err);showGate("login",errText(err),true)})}
    }
    A.onAuthStateChanged(auth,u=>{
      if(!u){ME=null;MYPERMS=[];acctButton(false);clearLocal();if(window.resetViewState)window.resetViewState();if(S.tab==="admin"||S.tab==="acct")S.tab="plan";render();
        /* the sign-in screen may already be open (person switched to «create account» while Firebase was starting): keep it and what was typed */
        const g=document.getElementById("gate");if(g&&!g.hidden&&["login","register","reset"].includes(AUTHMODE)&&g.querySelector("form"))return;
        showGate("login");return}
      afterSignIn(u);
    });
  }catch(err){console.error(err);if(!S.days.length)showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);else{hideGate();showMsg(L("Offline – du siehst den zuletzt geladenen Stand."),6000)}}
  /* back online after starting without connection: start sign-in again */
  window.addEventListener("online",()=>{if(!FB&&!FBP)location.reload();else if(ME)tick()});
  const tick=async()=>{
    if(document.visibilityState!=="visible"||!ME||!(ME.emailVerified||START))return;
    try{const st=await checkMember();if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":"denied");return}}catch(_){return}
    load(false).catch(()=>{});
  };
  setInterval(tick,POLL_MS);
  document.addEventListener("visibilitychange",tick);
})();
