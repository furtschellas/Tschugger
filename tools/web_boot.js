/* ---------- web boot (GitHub Pages): Firebase sign-in + encrypted data file ---------- */
const FB_CONFIG={apiKey:"AIzaSyBrHUJumAArmHv92qhZEbUFXSWrwvZaKjQ",authDomain:"tschugger-83692.firebaseapp.com",projectId:"tschugger-83692",storageBucket:"tschugger-83692.firebasestorage.app",messagingSenderId:"786764568575",appId:"1:786764568575:web:552eeefa77c44f5d24b9ca"};
const FB_V="10.12.2",ROOT_OWNERS=["furtschellas@gmail.com"],ADMINS=ROOT_OWNERS.slice(),DATA_URL="data.enc.json",POLL_MS=3*60*1000;
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
 "Alle Texte, die die App verschickt oder anzeigt. Platzhalter: {vorname} {name} {email} {app} {passwort} {disclaimer}. Du bearbeitest jeweils nur die gewählte Sprache; ohne eigenen Text gilt die Standardfassung.":{fr:"Tous les textes que l'app envoie ou affiche. Variables : {vorname} {name} {email} {app} {passwort} {disclaimer}. Tu modifies uniquement la langue choisie ; sans texte propre, la version standard s'applique.",it:"Tutti i testi che l'app invia o mostra. Segnaposto: {vorname} {name} {email} {app} {passwort} {disclaimer}. Modifichi solo la lingua scelta; senza testo proprio vale la versione standard.",en:"All texts the app sends or shows. Placeholders: {vorname} {name} {email} {app} {passwort} {disclaimer}. You only edit the selected language; without your own text the default applies."},
 "15 Min. vorher":{fr:"15 min avant",it:"15 min prima",en:"15 min before"},
 "30 Min. vorher":{fr:"30 min avant",it:"30 min prima",en:"30 min before"},
 "1 Std. vorher":{fr:"1 h avant",it:"1 ora prima",en:"1 hour before"},
 "2 Std. vorher":{fr:"2 h avant",it:"2 ore prima",en:"2 hours before"},
 "3 Std. vorher":{fr:"3 h avant",it:"3 ore prima",en:"3 hours before"},
 "1 Tag vorher":{fr:"1 jour avant",it:"1 giorno prima",en:"1 day before"},
 "Alle Drehtage":{fr:"Tous les jours de tournage",it:"Tutti i giorni di riprese",en:"All shooting days"},
 "Alle Prep-Termine":{fr:"Tous les rdv de prep",it:"Tutti gli appuntamenti prep",en:"All prep appointments"},
 "Termin":{fr:"Rendez-vous",it:"Appuntamento",en:"Appointment"},
 "Push-Nachrichten wurden im Browser nicht erlaubt.":{fr:"Les notifications n'ont pas été autorisées dans le navigateur.",it:"Le notifiche non sono state consentite nel browser.",en:"Notifications were not allowed in the browser."},
 "Test-Nachricht":{fr:"Message test",it:"Messaggio di prova",en:"Test message"},
 "So sehen Erinnerungen an deine Termine aus.":{fr:"Voici à quoi ressemblent les rappels de tes rendez-vous.",it:"Ecco come appaiono i promemoria dei tuoi appuntamenti.",en:"This is what reminders for your appointments look like."},
 "Push-Nachricht ausschalten":{fr:"Désactiver la notification",it:"Disattiva notifica",en:"Turn notification off"},
 "Push-Nachricht an":{fr:"Notification activée",it:"Notifica attiva",en:"Notification on"},
 "Dieser Browser unterstützt keine Push-Nachrichten.":{fr:"Ce navigateur ne prend pas en charge les notifications.",it:"Questo browser non supporta le notifiche.",en:"This browser does not support notifications."},
 "Push-Nachrichten sind in den Einstellungen dieses Browsers blockiert. Erlaube sie dort für diese Seite.":{fr:"Les notifications sont bloquées dans les réglages du navigateur. Autorise-les pour ce site.",it:"Le notifiche sono bloccate nelle impostazioni del browser. Consentile per questo sito.",en:"Notifications are blocked in this browser's settings. Allow them there for this site."},
 "Auf diesem Gerät einschalten":{fr:"Activer sur cet appareil",it:"Attiva su questo dispositivo",en:"Turn on for this device"},
 "Auf diesem Gerät aktiv":{fr:"Actif sur cet appareil",it:"Attivo su questo dispositivo",en:"Active on this device"},
 "Push-Nachrichten":{fr:"Notifications push",it:"Notifiche push",en:"Push notifications"},
 "Erinnerungen an kommende Termine erhalten":{fr:"Recevoir des rappels pour les prochains rdv",it:"Ricevi promemoria per i prossimi appuntamenti",en:"Get reminders for upcoming appointments"},
 "Erinnern":{fr:"Rappel",it:"Promemoria",en:"Remind me"},
 "Für welche Termine?":{fr:"Pour quels rdv ?",it:"Per quali appuntamenti?",en:"For which appointments?"},
 "Kommende Termine":{fr:"Prochains rdv",it:"Prossimi appuntamenti",en:"Upcoming appointments"},
 "Hier oder mit der Glocke in «Meine Termine» schaltest du einzelne Termine aus.":{fr:"Ici ou avec la cloche dans « Mes rendez-vous », tu désactives des rdv individuels.",it:"Qui o con la campanella in «I miei appuntamenti» disattivi singoli appuntamenti.",en:"Turn off single appointments here or with the bell in “My appointments”."},
 "Adresse des Cloudflare Workers für den Chat-Assistenten (und den zuverlässigen Zeitplan für Push und Dropbox). Leer = kein Assistent.":{fr:"Adresse du Cloudflare Worker pour l'assistant (et le planning fiable pour push et Dropbox). Vide = pas d'assistant.",it:"Indirizzo del Cloudflare Worker per l'assistente (e la pianificazione affidabile di push e Dropbox). Vuoto = nessun assistente.",en:"Address of the Cloudflare Worker for the assistant (and the reliable schedule for push and Dropbox). Empty = no assistant."},
 "Alle Motive mit Adresse, Karte und den Szenen, die dort gedreht werden.":{fr:"Tous les décors avec adresse, carte et scènes tournées sur place.",it:"Tutte le location con indirizzo, mappa e scene girate lì.",en:"All locations with address, map and the scenes shot there."},
 "Alle deine kommenden Termine an einem Ort – mit «In den Kalender» und der Glocke für Push-Nachrichten.":{fr:"Tous tes prochains rdv au même endroit – avec « Dans le calendrier » et la cloche pour les notifications.",it:"Tutti i tuoi prossimi appuntamenti in un posto – con «Nel calendario» e la campanella per le notifiche.",en:"All your upcoming appointments in one place – with “Add to calendar” and the bell for notifications."},
 "Allgemeine Infos zur Produktion und zur App.":{fr:"Infos générales sur la production et l'app.",it:"Info generali sulla produzione e sull'app.",en:"General info about the production and the app."},
 "Antworten ohne Gewähr – verbindlich sind die Unterlagen der Produktion.":{fr:"Réponses sans garantie – seuls les documents de la production font foi.",it:"Risposte senza garanzia – fanno fede i documenti della produzione.",en:"Answers without guarantee – the production's documents are binding."},
 "Assistent":{fr:"Assistant",it:"Assistente",en:"Assistant"},
 "Benutzer, Rollen, Dokumente und Einstellungen – nur mit Berechtigung sichtbar.":{fr:"Utilisateurs, rôles, documents et réglages – visible seulement avec autorisation.",it:"Utenti, ruoli, documenti e impostazioni – visibile solo con autorizzazione.",en:"Users, roles, documents and settings – only visible with permission."},
 "Bestätigungs-Mail, Passwort-Zurücksetzen und Anmelde-Link verschickt Firebase. Deren Texte änderst du in der Firebase-Konsole unter Authentication → Templates.":{fr:"L'e-mail de confirmation, la réinitialisation du mot de passe et le lien de connexion sont envoyés par Firebase. Modifie leurs textes dans la console Firebase sous Authentication → Templates.",it:"L'e-mail di conferma, il reset della password e il link di accesso li invia Firebase. I testi si modificano nella console Firebase in Authentication → Templates.",en:"The confirmation email, password reset and sign-in link are sent by Firebase. Change their texts in the Firebase console under Authentication → Templates."},
 "Chat-Assistent anzeigen (Knopf unten rechts)":{fr:"Afficher l'assistant (bouton en bas à droite)",it:"Mostra l'assistente (pulsante in basso a destra)",en:"Show the assistant (button bottom right)"},
 "Das Drehbuch mit Suche.":{fr:"Le scénario avec recherche.",it:"La sceneggiatura con ricerca.",en:"The script with search."},
 "Der Drehplan Tag für Tag: Szenen, Motive und Zeiten. Mit «Script» öffnest du eine Szene im Drehbuch, die Kamera zeigt Blocking-Fotos und -Filme.":{fr:"Le plan de tournage jour par jour : scènes, décors et horaires. « Script » ouvre la scène dans le scénario, la caméra montre photos et vidéos de blocking.",it:"Il piano di lavorazione giorno per giorno: scene, location e orari. «Script» apre la scena nella sceneggiatura, la videocamera mostra foto e video del blocking.",en:"The shooting schedule day by day: scenes, locations and times. “Script” opens a scene in the script, the camera shows blocking photos and videos."},
 "Der Owner kann nicht gesperrt oder entfernt werden.":{fr:"L'owner ne peut pas être bloqué ni supprimé.",it:"L'owner non può essere bloccato né rimosso.",en:"The owner cannot be blocked or removed."},
 "Die Crewliste nach Abteilungen – je nach Berechtigung mit Telefon und E-Mail.":{fr:"La liste de l'équipe par département – selon autorisation avec téléphone et e-mail.",it:"La lista crew per reparti – secondo l'autorizzazione con telefono ed e-mail.",en:"The crew list by department – depending on permission with phone and email."},
 "Die Dispo des Drehtags: Crew Call, Drehbeginn, Wrap, Locations und Cast.":{fr:"La dispo du jour de tournage : crew call, début du tournage, wrap, décors et cast.",it:"La dispo del giorno di riprese: crew call, inizio riprese, wrap, location e cast.",en:"The day's dispo: crew call, shooting start, wrap, locations and cast."},
 "Einführungstour":{fr:"Visite guidée",it:"Tour introduttivo",en:"Intro tour"},
 "Einführungstour anbieten":{fr:"Proposer la visite guidée",it:"Offri il tour introduttivo",en:"Offer the intro tour"},
 "Eingeschaltet wird die Tour allen einmalig angeboten und kann unter «Mein Konto» neu gestartet werden.":{fr:"Activée, la visite est proposée une fois à tous et peut être relancée sous « Mon compte ».",it:"Se attivo, il tour viene proposto una volta a tutti e si può riavviare in «Il mio account».",en:"When on, the tour is offered once to everyone and can be restarted under “My account”."},
 "Fertig!":{fr:"Terminé !",it:"Fatto!",en:"Done!"},
 "Frag den Assistenten, z. B. «Wo drehen wir morgen?» – er kennt die Daten der App.":{fr:"Demande à l'assistant, p. ex. « Où tourne-t-on demain ? » – il connaît les données de l'app.",it:"Chiedi all'assistente, ad es. «Dove giriamo domani?» – conosce i dati dell'app.",en:"Ask the assistant, e.g. “Where are we shooting tomorrow?” – it knows the app's data."},
 "Frag mich etwas zum Drehplan, zu Locations, zur Crew oder zur App.":{fr:"Pose-moi une question sur le plan, les décors, l'équipe ou l'app.",it:"Chiedimi qualcosa su piano, location, crew o app.",en:"Ask me about the schedule, locations, crew or the app."},
 "Frage":{fr:"Question",it:"Domanda",en:"Question"},
 "Frage eingeben …":{fr:"Ta question …",it:"Scrivi la domanda …",en:"Type your question …"},
 "In einer Minute zeigen wir dir die wichtigsten Funktionen. Du kannst die Tour später jederzeit unter «Mein Konto» starten.":{fr:"En une minute, nous te montrons les fonctions principales. Tu peux relancer la visite à tout moment sous « Mon compte ».",it:"In un minuto ti mostriamo le funzioni principali. Puoi avviare il tour in qualsiasi momento in «Il mio account».",en:"In one minute we'll show you the main features. You can start the tour any time under “My account”."},
 "KI-Assistent anbieten":{fr:"Proposer l'assistant IA",it:"Offri l'assistente IA",en:"Offer the AI assistant"},
 "Kurze Tour durch die App?":{fr:"Petite visite de l'app ?",it:"Un breve tour dell'app?",en:"Quick tour of the app?"},
 "Los geht's":{fr:"C'est parti",it:"Si parte",en:"Let's go"},
 "Neu":{fr:"Nouveau",it:"Nuovo",en:"New"},
 "Profil, Push-Nachrichten, hell/dunkel, Passwort und Abmelden. Hier kannst du diese Tour jederzeit neu starten.":{fr:"Profil, notifications, clair/sombre, mot de passe et déconnexion. Tu peux relancer cette visite ici.",it:"Profilo, notifiche, chiaro/scuro, password e logout. Qui puoi riavviare questo tour.",en:"Profile, notifications, light/dark, password and sign-out. You can restart this tour here."},
 "Senden":{fr:"Envoyer",it:"Invia",en:"Send"},
 "Standardtext wiederhergestellt.":{fr:"Texte standard rétabli.",it:"Testo standard ripristinato.",en:"Default text restored."},
 "Suche":{fr:"Recherche",it:"Ricerca",en:"Search"},
 "Sucht über alles: Szenen, Rollen, Personen, Locations.":{fr:"Cherche partout : scènes, rôles, personnes, décors.",it:"Cerca ovunque: scene, ruoli, persone, location.",en:"Searches everything: scenes, roles, people, locations."},
 "Test an mich":{fr:"Test à moi",it:"Test a me",en:"Test to me"},
 "Tour gemacht":{fr:"Visite faite",it:"Tour fatto",en:"Tour done"},
 "Keine Rolle":{fr:"Aucun rôle",it:"Nessun ruolo",en:"No role"},
 "Tour angefangen":{fr:"Visite commencée",it:"Tour iniziato",en:"Tour started"},
 "Tour offen":{fr:"Visite pas faite",it:"Tour non fatto",en:"Tour not done"},
 "Tour starten":{fr:"Lancer la visite",it:"Avvia il tour",en:"Start tour"},
 "Tour übersprungen":{fr:"Visite passée",it:"Tour saltato",en:"Tour skipped"},
 "Tour übersprungen – du findest sie unter «Mein Konto».":{fr:"Visite passée – tu la trouves sous « Mon compte ».",it:"Tour saltato – lo trovi in «Il mio account».",en:"Tour skipped – you'll find it under “My account”."},
 "Viel Spass mit der App. Die Tour findest du jederzeit wieder unter «Mein Konto».":{fr:"Amuse-toi bien avec l'app. La visite est toujours disponible sous « Mon compte ».",it:"Buon divertimento con l'app. Il tour lo ritrovi sempre in «Il mio account».",en:"Enjoy the app. You'll always find the tour under “My account”."},
 "Wann ist mein nächster Termin?":{fr:"Quel est mon prochain rdv ?",it:"Quando è il mio prossimo appuntamento?",en:"When is my next appointment?"},
 "Wer ist die Regie?":{fr:"Qui est à la réalisation ?",it:"Chi è la regia?",en:"Who is directing?"},
 "Wie funktioniert Meine Termine?":{fr:"Comment fonctionne Mes rendez-vous ?",it:"Come funziona I miei appuntamenti?",en:"How does My appointments work?"},
 "Wo drehen wir morgen?":{fr:"Où tourne-t-on demain ?",it:"Dove giriamo domani?",en:"Where are we shooting tomorrow?"},
 "Worker-Code und Anleitung":{fr:"Code du worker et guide",it:"Codice del worker e guida",en:"Worker code and guide"},
 "angepasst":{fr:"personnalisé",it:"personalizzato",en:"customized"},
 "Überspringen":{fr:"Passer",it:"Salta",en:"Skip"},
 "Fertig":{fr:"Terminé",it:"Fine",en:"Done"},
 "Aktualisieren":{fr:"Actualiser",it:"Aggiorna",en:"Update"},
 "Keine Verbindung.":{fr:"Pas de connexion.",it:"Nessuna connessione.",en:"No connection."},
 "Der Assistent ist gerade nicht erreichbar.":{fr:"L'assistant n'est pas joignable pour le moment.",it:"L'assistente non è raggiungibile al momento.",en:"The assistant is not reachable right now."},
 "Anzeigeoptionen":{fr:"Options d'affichage",it:"Opzioni di visualizzazione",en:"Display options"},
 "Blende im Drehplan ein oder aus, was du sehen willst: Info, Szenenbeschrieb, Cast, Adresse und Blocking. Deine Auswahl bleibt gespeichert.":{fr:"Affiche ou masque dans le plan ce que tu veux voir : info, description de scène, cast, adresse et blocking. Ton choix est enregistré.",it:"Mostra o nascondi nel piano ciò che vuoi vedere: info, descrizione scena, cast, indirizzo e blocking. La scelta resta salvata.",en:"Show or hide what you want to see in the schedule: info, scene description, cast, address and blocking. Your choice is saved."},
 "Wähle, welche Units du siehst – zum Beispiel nur die 2nd Unit. Ist eine Unit an diesem Tag nicht im Einsatz, ist ihr Knopf blass.":{fr:"Choisis les units affichées – par exemple seulement la 2nd Unit. Si une unit ne tourne pas ce jour-là, son bouton est pâle.",it:"Scegli quali unit vedere – per esempio solo la 2nd Unit. Se una unit non lavora quel giorno, il suo pulsante è sbiadito.",en:"Choose which units you see – for example only the 2nd Unit. If a unit isn't working that day, its button is faded."},
 "Die App erinnert dich jetzt auf Wunsch vor deinen Terminen – auch wenn sie geschlossen ist.":{fr:"Si tu le souhaites, l'app te rappelle désormais tes rendez-vous – même fermée.",it:"Ora l'app, se vuoi, ti ricorda i tuoi appuntamenti – anche quando è chiusa.",en:"The app can now remind you before your appointments – even when it's closed."},
 "Einzelne Termine schaltest du mit der Glocke in «Meine Termine» aus; alles Weitere unter «Mein Konto».":{fr:"Désactive des rdv individuels avec la cloche dans « Mes rendez-vous » ; le reste sous « Mon compte ».",it:"Disattivi singoli appuntamenti con la campanella in «I miei appuntamenti»; il resto in «Il mio account».",en:"Turn off single appointments with the bell in “My appointments”; everything else under “My account”."},
 "Nicht jetzt":{fr:"Pas maintenant",it:"Non ora",en:"Not now"},
 "Einschalten":{fr:"Activer",it:"Attiva",en:"Turn on"},
 "Push-Nachrichten sind eingeschaltet.":{fr:"Les notifications sont activées.",it:"Le notifiche sono attive.",en:"Notifications are on."},
 "Du kannst Push-Nachrichten jederzeit unter «Mein Konto» einschalten.":{fr:"Tu peux activer les notifications à tout moment sous « Mon compte ».",it:"Puoi attivare le notifiche in qualsiasi momento in «Il mio account».",en:"You can turn on notifications any time under “My account”."},
 "OK":{fr:"OK",it:"OK",en:"OK"},
 "Übersicht":{fr:"Aperçu",it:"Panoramica",en:"Overview"},
 "Namen und Details":{fr:"Noms et détails",it:"Nomi e dettagli",en:"Names and details"},
 "Alle aktiven Benutzer:innen der App, die am Set verpflegt werden.":{fr:"Tous les utilisateurs actifs de l'app nourris sur le plateau.",it:"Tutti gli utenti attivi dell'app che mangiano sul set.",en:"All active app users who are catered on set."},
 "Alle Sonderwünsche":{fr:"Tous les besoins particuliers",it:"Tutte le richieste speciali",en:"All special requests"},
 "Tage wählen":{fr:"Choisir le jour",it:"Scegli il giorno",en:"Choose a day"},
 "Wische durch die Tage: PREP, OFF, TRAVEL und die Drehtage D01, D02 … Heute ist hervorgehoben.":{fr:"Fais défiler les jours : PREP, OFF, TRAVEL et les jours de tournage D01, D02 … Aujourd'hui est mis en évidence.",it:"Scorri i giorni: PREP, OFF, TRAVEL e i giorni di riprese D01, D02 … Oggi è evidenziato.",en:"Swipe through the days: PREP, OFF, TRAVEL and shooting days D01, D02 … Today is highlighted."},
 "Unit filtern":{fr:"Filtrer par unit",it:"Filtra per unit",en:"Filter by unit"},
 "Auch im Callsheet wählst du oben den Tag und filterst nach Unit.":{fr:"Dans la callsheet aussi, tu choisis le jour en haut et filtres par unit.",it:"Anche nel callsheet scegli il giorno in alto e filtri per unit.",en:"In the call sheet you also pick the day at the top and filter by unit."},
 "Optionen":{fr:"Options",it:"Opzioni",en:"Options"},
 "«Szenen» klappt alle Szenen auf oder zu; daneben blendest du Info und Adresse ein und filterst nach Unit.":{fr:"« Scènes » ouvre ou ferme toutes les scènes ; à côté, tu affiches info et adresse et filtres par unit.",it:"«Scene» apre o chiude tutte le scene; accanto mostri info e indirizzo e filtri per unit.",en:"“Scenes” expands or collapses all scenes; next to it you show info and address and filter by unit."},
 "Suche nach Motiv, Adresse oder Szene.":{fr:"Cherche un décor, une adresse ou une scène.",it:"Cerca location, indirizzo o scena.",en:"Search for a location, address or scene."},
 "Crew durchsuchen":{fr:"Chercher dans l'équipe",it:"Cerca nella crew",en:"Search the crew"},
 "Suche nach Name, Funktion oder Abteilung. Mit «vCard» speicherst du einen Kontakt direkt im Telefon.":{fr:"Cherche par nom, fonction ou département. « vCard » enregistre un contact dans ton téléphone.",it:"Cerca per nome, ruolo o reparto. Con «vCard» salvi un contatto nel telefono.",en:"Search by name, role or department. “vCard” saves a contact straight to your phone."},
 "Zusatzinfos":{fr:"Infos supplémentaires",it:"Info aggiuntive",en:"Extra info"},
 "Je nach Berechtigung: Essen, Geburtstage, Kontoinfos und alle Kontakte als VCF.":{fr:"Selon l'autorisation : repas, anniversaires, infos de compte et tous les contacts en VCF.",it:"Secondo l'autorizzazione: pasti, compleanni, info account e tutti i contatti come VCF.",en:"Depending on permission: food, birthdays, account info and all contacts as VCF."},
 "Blende Infobox, Drehtag & Zeit, englische Szenenbezeichnung, Cast, Adresse und Blocking ein oder aus.":{fr:"Affiche ou masque infobox, jour et heure, titre anglais de la scène, cast, adresse et blocking.",it:"Mostra o nascondi infobox, giorno e ora, titolo inglese della scena, cast, indirizzo e blocking.",en:"Show or hide info box, shooting day & time, English scene heading, cast, address and blocking."},
 "Suchen nach":{fr:"Rechercher par",it:"Cerca per",en:"Search by"},
 "Suche im Drehbuch gezielt nach Rolle, Szene, Drehtag, Person, Motiv oder Text.":{fr:"Cherche dans le scénario par rôle, scène, jour, personne, décor ou texte.",it:"Cerca nella sceneggiatura per ruolo, scena, giorno, persona, location o testo.",en:"Search the script by role, scene, shooting day, person, location or text."},
 "Alle Essenswünsche, Unverträglichkeiten und Allergien der Crew auf einen Blick.":{fr:"Tous les régimes, intolérances et allergies de l'équipe en un coup d'œil.",it:"Tutte le preferenze alimentari, intolleranze e allergie della crew in un colpo d'occhio.",en:"All the crew's dietary wishes, intolerances and allergies at a glance."},
 "Push-Glocke":{fr:"Cloche de notification",it:"Campanella notifiche",en:"Notification bell"},
 "Mit der Glocke schaltest du die Erinnerung für einzelne Termine aus oder ein.":{fr:"La cloche active ou désactive le rappel d'un rdv.",it:"Con la campanella attivi o disattivi il promemoria di un singolo appuntamento.",en:"The bell turns the reminder for a single appointment on or off."},
 "Hier stellst du ein, ob, wann und für welche Termine du erinnert wirst.":{fr:"Ici tu règles si, quand et pour quels rdv tu reçois un rappel.",it:"Qui imposti se, quando e per quali appuntamenti ricevere promemoria.",en:"Here you set whether, when and for which appointments you're reminded."},
 "Termin in den Kalender":{fr:"Rdv dans le calendrier",it:"Appuntamento nel calendario",en:"Add to calendar"},
 "Mit dem Kalender-Knopf übernimmst du einen Termin direkt in deinen Kalender (Handy oder Computer).":{fr:"Le bouton calendrier ajoute un rdv directement à ton calendrier (téléphone ou ordinateur).",it:"Con il pulsante calendario aggiungi un appuntamento al tuo calendario (telefono o computer).",en:"The calendar button adds an appointment straight to your calendar (phone or computer)."},
 "E-Mail-Verteiler":{fr:"Liste de diffusion",it:"Lista e-mail",en:"Email list"},
 "Der Brief-Knopf öffnet eine E-Mail an alle Teilnehmenden dieses Termins – praktisch für kurzfristige Infos.":{fr:"Le bouton enveloppe ouvre un e-mail à tous les participants de ce rdv – pratique pour les infos de dernière minute.",it:"Il pulsante busta apre un'e-mail a tutti i partecipanti – utile per info dell'ultimo minuto.",en:"The envelope button opens an email to everyone in this appointment – handy for short-notice info."},
 "Die Crewliste nach Abteilungen.":{fr:"La liste de l'équipe par département.",it:"La lista crew per reparti.",en:"The crew list by department."},
 "Mit Telefon und E-Mail – ein Tipp genügt zum Anrufen oder Schreiben.":{fr:"Avec téléphone et e-mail – un tap suffit pour appeler ou écrire.",it:"Con telefono ed e-mail – basta un tocco per chiamare o scrivere.",en:"With phone and email – one tap to call or write."},
 "Kalender-Export":{fr:"Export calendrier",it:"Esporta nel calendario",en:"Calendar export"},
 "«Alle in den Kalender» übernimmt alle deine Termine auf einmal; mit dem Kalender-Knopf bei jedem Termin einzeln.":{fr:"« Tout dans le calendrier » ajoute tous tes rdv d'un coup ; le bouton calendrier de chaque rdv les ajoute un par un.",it:"«Tutti nel calendario» aggiunge tutti gli appuntamenti in una volta; il pulsante calendario di ciascuno li aggiunge singolarmente.",en:"“All to calendar” adds all your appointments at once; the calendar button on each adds them one by one."},
 "Deine Verwaltung:":{fr:"Ton administration :",it:"La tua gestione:",en:"Your admin area:"},
 "Push-Nachrichten senden":{fr:"Envoyer des notifications",it:"Inviare notifiche",en:"Send notifications",hi:"पुश संदेश भेजें"},
 "Push-Nachricht senden":{fr:"Envoyer une notification",it:"Invia una notifica",en:"Send a notification",hi:"पुश संदेश भेजें"},
 "Geht sofort als Push-Nachricht an alle, die Push-Nachrichten eingeschaltet haben.":{fr:"Part tout de suite en notification à tous ceux qui les ont activées.",it:"Parte subito come notifica a tutti quelli che le hanno attivate.",en:"Goes out right away as a notification to everyone who has them turned on.",hi:"तुरंत उन सभी को पुश संदेश के रूप में जाता है जिन्होंने सूचनाएँ चालू की हैं।"},
 "Titel":{fr:"Titre",it:"Titolo",en:"Title",hi:"शीर्षक"},
 "z. B. Drehplan geändert":{fr:"p. ex. plan modifié",it:"p. es. piano cambiato",en:"e.g. schedule changed",hi:"जैसे शेड्यूल बदला"},
 "Nachricht":{fr:"Message",it:"Messaggio",en:"Message",hi:"संदेश"},
 "Kurz und klar, max. 300 Zeichen":{fr:"Court et clair, max. 300 caractères",it:"Breve e chiaro, max. 300 caratteri",en:"Short and clear, max. 300 characters",hi:"छोटा और साफ़, अधिकतम 300 अक्षर"},
 "Empfänger":{fr:"Destinataires",it:"Destinatari",en:"Recipients",hi:"प्राप्तकर्ता"},
 "Auswahl nach Rolle und/oder Abteilung":{fr:"Sélection par rôle et/ou département",it:"Selezione per ruolo e/o reparto",en:"Choose by role and/or department",hi:"भूमिका और/या विभाग से चुनें"},
 "Abteilungen":{fr:"Départements",it:"Reparti",en:"Departments",hi:"विभाग"},
 "Wer zu einer gewählten Rolle ODER Abteilung gehört, bekommt die Nachricht.":{fr:"Toute personne d'un rôle OU d'un département choisi reçoit le message.",it:"Riceve il messaggio chi appartiene a un ruolo O reparto scelto.",en:"Anyone in a selected role OR department gets the message.",hi:"चुनी गई भूमिका या विभाग का हर व्यक्ति संदेश पाएगा।"},
 "Jetzt senden":{fr:"Envoyer maintenant",it:"Invia ora",en:"Send now",hi:"अभी भेजें"},
 "Bitte Titel und Nachricht eingeben.":{fr:"Saisis un titre et un message.",it:"Inserisci titolo e messaggio.",en:"Please enter a title and a message.",hi:"कृपया शीर्षक और संदेश लिखें।"},
 "Bitte mindestens eine Rolle oder Abteilung wählen.":{fr:"Choisis au moins un rôle ou un département.",it:"Scegli almeno un ruolo o un reparto.",en:"Please choose at least one role or department.",hi:"कम से कम एक भूमिका या विभाग चुनें।"},
 "Push-Nachricht jetzt senden an:":{fr:"Envoyer la notification maintenant à :",it:"Inviare ora la notifica a:",en:"Send the notification now to:",hi:"पुश संदेश अभी भेजें:"},
 "alle":{fr:"tous",it:"tutti",en:"everyone",hi:"सभी"},
 "Gesendet – die Nachricht kommt in etwa einer Minute an.":{fr:"Envoyé – le message arrive dans environ une minute.",it:"Inviato – il messaggio arriva tra circa un minuto.",en:"Sent – the message arrives in about a minute.",hi:"भेज दिया – संदेश लगभग एक मिनट में पहुँचेगा।"},
 "Gespeichert – die Nachricht geht mit dem nächsten Lauf (spätestens in 15 Minuten) raus.":{fr:"Enregistré – le message part au prochain passage (dans 15 minutes au plus).",it:"Salvato – il messaggio parte al prossimo giro (entro 15 minuti).",en:"Saved – the message goes out with the next run (within 15 minutes).",hi:"सहेजा गया – संदेश अगली बार (अधिकतम 15 मिनट में) भेजा जाएगा।"},
 "Mit dem Briefumschlag schickst du sofort eine Push-Nachricht an alle – oder nur an bestimmte Rollen und Abteilungen.":{fr:"Avec l'enveloppe, tu envoies tout de suite une notification à tous – ou seulement à certains rôles et départements.",it:"Con la busta invii subito una notifica a tutti – o solo a certi ruoli e reparti.",en:"With the envelope you instantly send a notification to everyone – or only to certain roles and departments.",hi:"लिफ़ाफ़े से तुरंत सभी को – या केवल चुनी भूमिकाओं और विभागों को – पुश संदेश भेजें।"},
 "Sprache":{fr:"Langue",it:"Lingua",en:"Language",hi:"भाषा"},
 "Hier wechselst du die Sprache der App – so sieht sie zum Beispiel auf Englisch aus. Mit «Weiter» geht es in deiner Sprache weiter.":{fr:"Ici tu changes la langue de l'app – voici par exemple l'anglais. « Suivant » te ramène à ta langue.",it:"Qui cambi la lingua dell'app – ecco per esempio l'inglese. «Avanti» ti riporta alla tua lingua.",en:"Here you change the app's language – this is how it looks in another language. “Next” brings back your language.",hi:"यहाँ ऐप की भाषा बदलें – उदाहरण के लिए अंग्रेज़ी में ऐसा दिखता है। «आगे» से आपकी भाषा वापस आती है।"},
 "Hell / Dunkel":{fr:"Clair / sombre",it:"Chiaro / scuro",en:"Light / dark",hi:"हल्का / गहरा"},
 "Mit der Sonne wechselst du zwischen dunkler und heller Darstellung – hell ist draussen bei Sonne gut lesbar. Mit «Weiter» kommt deine Einstellung zurück.":{fr:"Le soleil passe du mode sombre au mode clair – le clair se lit bien dehors au soleil. « Suivant » rétablit ton réglage.",it:"Con il sole passi tra scuro e chiaro – il chiaro si legge bene fuori al sole. «Avanti» ripristina la tua impostazione.",en:"The sun switches between dark and light – light is easy to read outdoors in sunshine. “Next” restores your setting.",hi:"सूरज से गहरा और हल्का मोड बदलें – धूप में बाहर हल्का मोड आसानी से पढ़ा जाता है। «आगे» से आपकी सेटिंग वापस आती है।"},
 "Auf dem iPhone/iPad: zuerst die App über «Teilen → Zum Home-Bildschirm» hinzufügen und von dort öffnen – dann kannst du Push-Nachrichten einschalten.":{fr:"Sur iPhone/iPad : ajoute d'abord l'app via « Partager → Sur l'écran d'accueil » et ouvre-la depuis là – tu pourras alors activer les notifications.",it:"Su iPhone/iPad: aggiungi prima l'app con «Condividi → Aggiungi a Home» e aprila da lì – poi puoi attivare le notifiche.",en:"On iPhone/iPad: first add the app via “Share → Add to Home Screen” and open it from there – then you can turn on notifications.",hi:"iPhone/iPad पर: पहले «शेयर → होम स्क्रीन पर जोड़ें» से ऐप जोड़ें और वहीं से खोलें – फिर आप पुश सूचनाएँ चालू कर सकते हैं।"},
 "Darsteller":{fr:"Comédiens",it:"Attori",en:"Cast",hi:"कलाकार"},
 "Gesendet an {n} Geräte.":{fr:"Envoyé à {n} appareils.",it:"Inviato a {n} dispositivi.",en:"Sent to {n} devices.",hi:"{n} डिवाइस पर भेजा गया।"},
 "Noch keine Push-Nachrichten gesendet.":{fr:"Aucune notification envoyée pour l'instant.",it:"Nessuna notifica inviata finora.",en:"No notifications sent yet.",hi:"अभी तक कोई पुश संदेश नहीं भेजा गया।"},
 "{n} Geräte":{fr:"{n} appareils",it:"{n} dispositivi",en:"{n} devices",hi:"{n} डिवाइस"},
 "An":{fr:"À",it:"A",en:"To",hi:"को"},
 "Von":{fr:"De",it:"Da",en:"From",hi:"से"},
 "Erneut senden":{fr:"Renvoyer",it:"Invia di nuovo",en:"Send again",hi:"फिर से भेजें"},
 "Verlauf":{fr:"Historique",it:"Cronologia",en:"History",hi:"इतिहास"},
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
 "zuletzt online":{fr:"dernière connexion",it:"ultimo accesso",en:"last online"},
 "heute":{fr:"aujourd'hui",it:"oggi",en:"today"},
 "gestern":{fr:"hier",it:"ieri",en:"yesterday"},
 "vor {n} Min.":{fr:"il y a {n} min",it:"{n} min fa",en:"{n} min ago"},
 "noch nie online":{fr:"jamais en ligne",it:"mai online",en:"never online"},
 "Zuletzt online":{fr:"Dernière connexion",it:"Ultimo accesso",en:"Last online"},
 "zuletzt aktiv":{fr:"dernière activité",it:"ultima attività",en:"last active"},
 "Standard":{fr:"Standard",it:"Standard",en:"Default"},
 "Gilt für alle ohne andere Rolle, auch für neue Benutzer:innen.":{fr:"S'applique à tous sans autre rôle, y compris les nouveaux utilisateurs.",it:"Vale per tutti senza altro ruolo, anche per i nuovi utenti.",en:"Applies to everyone without another role, including new users."},
 "Für die App-Verwaltung fehlt die Berechtigung «Einstellungen ändern».":{fr:"Il manque l'autorisation « Modifier les paramètres » pour l'administration.",it:"Per l'amministrazione manca il permesso «Modificare le impostazioni».",en:"The permission “Change settings” is needed for app management."},
 "keine":{fr:"aucun",it:"nessuno",en:"none"},
 "Anmeldung":{fr:"Connexion",it:"Accesso",en:"Sign-in"},
 "Ausgeschaltet verschwindet «Mit Google anmelden» auf der Anmeldeseite. Wer schon mit Google angemeldet ist, bleibt angemeldet.":{fr:"Désactivé, « Se connecter avec Google » disparaît de la page de connexion. Les personnes déjà connectées avec Google le restent.",it:"Disattivato, «Accedi con Google» scompare dalla pagina di accesso. Chi è già connesso con Google resta connesso.",en:"When off, “Sign in with Google” disappears from the sign-in page. People already signed in with Google stay signed in."},
 "Mit Google anmelden anbieten":{fr:"Proposer la connexion avec Google",it:"Offrire l'accesso con Google",en:"Offer sign-in with Google"},
 "ohne Sonderwünsche":{fr:"sans demande particulière",it:"senza richieste particolari",en:"no special requests"},
 "mit Sonderwünschen":{fr:"avec demandes particulières",it:"con richieste particolari",en:"with special requests"},
 "Weitere Allergien":{fr:"Autres allergies",it:"Altre allergie",en:"Other allergies"},
 "Keine Rolle (eingeschränkt)":{fr:"Aucun rôle (restreint)",it:"Nessun ruolo (limitato)",en:"No role (restricted)"},
 "Wird neuen Benutzer:innen automatisch zugewiesen.":{fr:"Attribué automatiquement aux nouveaux utilisateurs.",it:"Assegnato automaticamente ai nuovi utenti.",en:"Assigned to new users automatically."},
 "Personen ohne Rolle sehen weder Drehplan, Drehbuch noch Blocking. Hier kannst du ihnen zusätzlich freigeben:":{fr:"Les personnes sans rôle ne voient ni le plan, ni le scénario, ni le blocking. Tu peux leur ouvrir en plus :",it:"Le persone senza ruolo non vedono piano, sceneggiatura né blocking. Qui puoi concedere in più:",en:"People without a role see neither schedule, script nor blocking. You can additionally allow:"},
 "Dokumente":{fr:"Documents",it:"Documenti",en:"Documents"},
 "Owner":{fr:"Owner",it:"Owner",en:"Owner"},
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
 "Wer hat welchen Zugriff?":{fr:"Qui a accès à quoi ?",it:"Chi ha accesso a cosa?",en:"Who has which access?",hi:"किसके पास कौन-सी पहुँच है?"},
 "Tippe auf eine Berechtigung, um zu sehen, wer sie hat – und über welche Rolle.":{fr:"Touche une autorisation pour voir qui l'a – et par quel rôle.",it:"Tocca un'autorizzazione per vedere chi ce l'ha – e con quale ruolo.",en:"Tap a permission to see who has it – and through which role.",hi:"किसी अनुमति पर टैप करें और देखें कि वह किसके पास है – और किस भूमिका से।"},
 "Niemand":{fr:"Personne",it:"Nessuno",en:"Nobody",hi:"कोई नहीं"},
 "z. B. Kamera-Assistenz":{fr:"p. ex. assistant·e caméra",it:"p. es. assistente camera",en:"e.g. camera assistant",hi:"जैसे कैमरा असिस्टेंट"},
 "Keine Sonderwünsche.":{fr:"Aucun besoin particulier.",it:"Nessuna richiesta speciale.",en:"No special requests.",hi:"कोई विशेष अनुरोध नहीं।"},
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
const LANGS=[["de","Deutsch"],["fr","Français"],["it","Italiano"],["en","English"],["hi","हिन्दी"]];
/* languages offered in the app; the main admin picks them (Firestore config/app.langs), cached for the sign-in screen */
let APPLANGS=["de","fr","it","en"];window.UNIT3=false;window.BDAYPUB=false;window.DOCS={};try{window.DOCS=JSON.parse(localStorage.getItem("appdocs")||"{}")||{}}catch(_){}window.GOOGLEON=true;try{window.GOOGLEON=localStorage.getItem("appgoogle")!=="0"}catch(_){}window.PUBV={phone:false,email:false,mycal:false};try{const x=JSON.parse(localStorage.getItem("apppubv")||"null");if(x&&typeof x==="object")Object.assign(window.PUBV,x)}catch(_){}window.SCRIPTON=true;window.TABSON=null;window.TABORDER=null;window.AUTOUPD=true;try{try{const o=JSON.parse(localStorage.getItem("apptaborder")||"null");if(Array.isArray(o))window.TABORDER=o}catch(_){}window.AUTOUPD=localStorage.getItem("appauto")!=="0";try{const t=JSON.parse(localStorage.getItem("apptabs")||"null");if(Array.isArray(t)&&t.length)window.TABSON=t}catch(_){}window.SCRIPTON=localStorage.getItem("appscript")!=="0";window.BDAYPUB=localStorage.getItem("appbdaypub")==="1";const u=localStorage.getItem("appunit2");if(u!==null)window.UNIT2=u==="1";window.UNIT3=localStorage.getItem("appunit3")==="1";const mu=localStorage.getItem("appmap");if(mu)window.MAPURL=mu}catch(_){}
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
    {const c=d.exists()?d.data():{};const nv={phone:c.phonePublic===true,email:c.emailPublic===true,mycal:c.mycalPublic===true};if(JSON.stringify(nv)!==JSON.stringify(window.PUBV)){window.PUBV=nv;try{localStorage.setItem("apppubv",JSON.stringify(nv))}catch(_){}render()}}
    {const go=!(d.exists()&&d.data().googleLogin===false);if(window.GOOGLEON!==go){window.GOOGLEON=go;try{localStorage.setItem("appgoogle",go?"1":"0")}catch(_){}try{const g=document.getElementById("gate");if(g&&!g.hidden&&(AUTHMODE==="login"||AUTHMODE==="register")&&!g.querySelector("input:focus"))showGate(AUTHMODE)}catch(_){}}}
    {const c=d.exists()?d.data():{};const ce=c.chatEnabled!==false,te=c.tourEnabled!==false;if(window.CHATEN!==ce||window.TOUREN!==te){window.CHATEN=ce;window.TOUREN=te;try{localStorage.setItem("appchaton",ce?"1":"0");localStorage.setItem("apptouron",te?"1":"0")}catch(_){}}}
    {const cu=String((d.exists()&&d.data().chatUrl)||"");if(window.CHATURL!==cu){window.CHATURL=cu;try{localStorage.setItem("appchat",cu)}catch(_){}}}
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
const PERMS=[["view.plan","Drehplan sehen","Drehplan"],["view.prep","Prep sehen","Drehplan"],["view.dispo","Callsheet sehen","Drehplan"],["view.script","Drehbuch sehen","Drehbuch"],["view.blocking","Blocking sehen","Drehbuch"],["view.crew","Crewliste sehen","Crewliste"],["view.phone","Telefon sehen","Crewliste"],["view.email","E-Mail sehen","Crewliste"],["contacts.extra","Externe Kontakte sehen","Crewliste"],["crew.food","Essen sehen","Crewliste"],["crew.bday","Geburtstage sehen","Crewliste"],["crew.vcf","VCF exportieren","Crewliste"],["view.mycal","Meine Termine sehen","Termine"],["mycal.all","Alle Termine sehen","Termine"],["push.send","Push-Nachrichten senden","Termine"],["users.view","Benutzer sehen","Benutzer"],["users.edit","Benutzer ändern","Benutzer"],["users.invite","Benutzer einladen","Benutzer"],["users.requests","Anfragen freischalten","Benutzer"],["settings","Einstellungen ändern","App"]];
const VIEWPERMS=PERMS.filter(x=>x[0].startsWith("view.")).map(x=>x[0]);
const ADMIN_DEFAULT=PERMS.map(x=>x[0]).filter(p=>p!=="settings");
let MYPERMS=[],MYROLE="",ADMINPERMS=ADMIN_DEFAULT.slice();
const can=p=>isOwner()||(isAdmin()&&ADMINPERMS.includes(p))||MYPERMS.includes(p);
/* the gear (App-Verwaltung) only with the permission «Einstellungen ändern» */
const canAdm=()=>isOwner()||can("settings");
/* what someone sees: without a role everything as before; with a role (or as admin) only the areas the role allows */
window.viewOK=k=>{if(!ME||isOwner())return true;if(!isAdmin()&&!MYROLE){if(["plan","script","blocking"].includes(k))return false;return k in window.PUBV?window.PUBV[k]===true:true}return can("view."+k)};
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
  DATAKEY=await crypto.subtle.importKey("raw",b64(kv),{name:"AES-GCM"},false,["encrypt","decrypt"]);
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
  LASTSTAMP=enc.stamp||null;applyData(data);scheduleRender();if(typeof pushSyncSoon==="function")pushSyncSoon();return true;
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
  if(!isOwner()&&u.emailVerified){try{if((await F.getDoc(F.doc(db,"owners",lc(u.email)))).exists()&&!ADMINS.includes(lc(u.email)))ADMINS.push(lc(u.email))}catch(_){}}
  if(!isOwner()&&u.emailVerified){try{COADMIN=(await F.getDoc(F.doc(db,"admins",lc(u.email)))).exists()}catch(_){COADMIN=false}}
  MYPERMS=[];MYROLE="";ADMINPERMS=ADMIN_DEFAULT.slice();
  if(COADMIN){try{const ad=await F.getDoc(F.doc(db,"roles","admin"));if(ad.exists())ADMINPERMS=(ad.data().perms||[]).filter(p=>PERMS.some(x=>x[0]===p))}catch(_){}}
  if(!isAdmin()){try{const ur=await F.getDoc(F.doc(db,"userroles",lc(u.email)));if(ur.exists()){MYROLE=String(ur.data().role||"");const rd=MYROLE?await F.getDoc(F.doc(db,"roles",MYROLE)):null;if(rd&&rd.exists())MYPERMS=(rd.data().perms||[]).filter(p=>PERMS.some(x=>x[0]===p))}}catch(_){}
  }
  if(isOwner())setTimeout(migrateCrew,1500);
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
  const langs='<div class="lang glang"><button type="button" data-glang="de">DE</button><button type="button" data-glang="fr">FR</button><button type="button" data-glang="it">IT</button><button type="button" data-glang="en">EN</button><button type="button" data-glang="hi">HI</button></div>';
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
const PREFKEYS=["theme","pv","sv","lv","spt","uf","pu","welcomeAck","push","chat","tour"];let PREFT=null,PREFAPPLY=false;
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
  if(typeof p.push==="string")pushSyncSoon();
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
  body:"Hinweis: Die App ist eine BETA-Testversion. Alle angezeigten Daten sind ohne Gewähr. Die Produktion und das Entwicklungsteam übernehmen KEINE Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Daten. Verbindlich sind immer die offiziellen Unterlagen der Produktion (Drehplan, Callsheet, Dispo)."},
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

/* default texts in the other languages (German defaults are above) */
const DOCI18N={
 disclaimer:{hi:{"body": "नोट: यह ऐप BETA परीक्षण संस्करण है। दिखाया गया सारा डेटा बिना गारंटी के है। प्रोडक्शन और डेवलपर्स डेटा के सही, पूर्ण या अद्यतन होने की कोई गारंटी नहीं देते। प्रोडक्शन के आधिकारिक दस्तावेज़ (शेड्यूल, Callsheet, Dispo) ही मान्य हैं।"},fr:{body:"Remarque : l'app est une version de test BETA. Toutes les données affichées sont sans garantie. La production et les développeurs n'assument AUCUNE garantie quant à l'exactitude, l'exhaustivité ou l'actualité des données. Seuls les documents officiels de la production (plan de tournage, callsheet, dispo) font foi."},
  it:{body:"Nota: l'app è una versione di prova BETA. Tutti i dati visualizzati sono senza garanzia. La produzione e gli sviluppatori NON si assumono alcuna garanzia sulla correttezza, completezza o attualità dei dati. Fanno fede sempre i documenti ufficiali della produzione (piano di lavorazione, callsheet, dispo)."},
  en:{body:"Note: the app is a BETA test version. All data shown is without guarantee. The production and the developers accept NO liability for the data being correct, complete or up to date. The official production documents (schedule, call sheet, dispo) are always binding."}},
 welcome:{hi:{"subject": "TSCHUGGER ऐप में आपका स्वागत है!", "body": "आपके साथ होने की खुशी है। यहाँ TSCHUGGER Tigerblood का शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट एक ही जगह मिलेंगे।\n\n{disclaimer}\n\nसारी सामग्री गोपनीय है और केवल Crew के लिए है – कृपया आगे न भेजें।\n\nकोई गलती मिली या कोई सुझाव है? Stefan Künzler से संपर्क करें।"},fr:{subject:"Bienvenue dans l'app TSCHUGGER !",body:"Ravi·e de t'accueillir. Tu trouves ici le plan de tournage, les callsheets, la liste de l'équipe, les décors et le scénario de TSCHUGGER Tigerblood au même endroit.\n\n{disclaimer}\n\nTous les contenus sont confidentiels et réservés à l'équipe – merci de ne pas les diffuser.\n\nUne erreur ou une suggestion ? Contacte Stefan Künzler."},
  it:{subject:"Benvenuta/o nell'app TSCHUGGER!",body:"Che bello averti a bordo. Qui trovi piano di lavorazione, callsheet, lista crew, location e sceneggiatura di TSCHUGGER Tigerblood in un unico posto.\n\n{disclaimer}\n\nTutti i contenuti sono riservati e destinati solo alla crew – per favore non diffonderli.\n\nHai trovato un errore o hai un desiderio? Rivolgiti a Stefan Künzler."},
  en:{subject:"Welcome to the TSCHUGGER app!",body:"Great to have you on board. Here you'll find the shooting schedule, call sheets, crew list, locations and script of TSCHUGGER Tigerblood in one place.\n\n{disclaimer}\n\nAll content is confidential and for the crew only – please do not share it.\n\nFound a mistake or have a wish? Get in touch with Stefan Künzler."}},
 invite:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच", "body": "नमस्ते {vorname}\n\nआपको TSCHUGGER Tigerblood Crew ऐप की पहुँच मिल गई है: शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट।\n\nकैसे करें:\n1. {app}\n2. ठीक इसी ई-मेल पते से «खाता बनाएँ»: {email}\n3. पुष्टि वाला ई-मेल खोलें और लिंक पर टैप करें – स्पैम फ़ोल्डर भी देखें।\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER",body:"Bonjour {vorname}\n\nTu as accès à l'app de l'équipe de TSCHUGGER Tigerblood : plan de tournage, callsheets, liste de l'équipe, décors et scénario.\n\nComment faire :\n1. {app}\n2. « Créer un compte » avec exactement cette adresse e-mail : {email}\n3. Ouvre l'e-mail de confirmation et tape sur le lien – regarde aussi dans les spams.\n\n{disclaimer}\n\nÀ bientôt sur le plateau !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER",body:"Ciao {vorname}\n\nhai accesso all'app della crew di TSCHUGGER Tigerblood: piano di lavorazione, callsheet, lista crew, location e sceneggiatura.\n\nCome fare:\n1. {app}\n2. «Crea account» con esattamente questo indirizzo e-mail: {email}\n3. Apri l'e-mail di conferma e tocca il link – controlla anche lo spam.\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app",body:"Hi {vorname}\n\nyou now have access to the TSCHUGGER Tigerblood crew app: schedule, call sheets, crew list, locations and script.\n\nHow it works:\n1. {app}\n2. “Create account” with exactly this email address: {email}\n3. Open the confirmation email and tap the link – please also check your spam folder.\n\n{disclaimer}\n\nSee you on set!"}},
 approved:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच सक्रिय है", "body": "नमस्ते {vorname}\n\nTSCHUGGER Tigerblood Crew ऐप में आपकी पहुँच सक्रिय हो गई है। इस पते ({email}) से यहाँ साइन इन करें:\n{app}\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER est activé",body:"Bonjour {vorname}\n\nton accès à l'app de l'équipe de TSCHUGGER Tigerblood est activé. Connecte-toi ici avec cette adresse ({email}) :\n{app}\n\n{disclaimer}\n\nÀ bientôt sur le plateau !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER è attivo",body:"Ciao {vorname}\n\nil tuo accesso all'app della crew di TSCHUGGER Tigerblood è attivo. Accedi qui con questo indirizzo ({email}):\n{app}\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app is active",body:"Hi {vorname}\n\nyour access to the TSCHUGGER Tigerblood crew app is active. Sign in here with this address ({email}):\n{app}\n\n{disclaimer}\n\nSee you on set!"}},
 startpw:{hi:{"subject": "TSCHUGGER ऐप में आपकी पहुँच", "body": "नमस्ते {vorname}\n\nTSCHUGGER Tigerblood Crew ऐप के लिए आपका खाता तैयार है:\n{app}\n\nई-मेल: {email}\nशुरुआती पासवर्ड: {passwort}\n\nपहली बार साइन इन करने पर आप अपना पासवर्ड चुनेंगे।\n\n{disclaimer}\n\nसेट पर मिलते हैं!"},fr:{subject:"Ton accès à l'app TSCHUGGER",body:"Bonjour {vorname}\n\nton compte pour l'app de l'équipe de TSCHUGGER Tigerblood est prêt :\n{app}\n\nE-mail : {email}\nMot de passe initial : {passwort}\n\nÀ la première connexion, tu choisis ton propre mot de passe.\n\n{disclaimer}\n\nÀ bientôt sur le plateau !"},
  it:{subject:"Il tuo accesso all'app TSCHUGGER",body:"Ciao {vorname}\n\nil tuo account per l'app della crew di TSCHUGGER Tigerblood è pronto:\n{app}\n\nE-mail: {email}\nPassword iniziale: {passwort}\n\nAl primo accesso scegli una password tua.\n\n{disclaimer}\n\nA presto sul set!"},
  en:{subject:"Your access to the TSCHUGGER app",body:"Hi {vorname}\n\nyour account for the TSCHUGGER Tigerblood crew app is ready:\n{app}\n\nEmail: {email}\nStart password: {passwort}\n\nWhen you sign in for the first time you choose your own password.\n\n{disclaimer}\n\nSee you on set!"}}};
const DOCLANGS=["de","fr","it","en","hi"];
/* text of a document in one language: own text (config/app.docs[k][lang]; German also from the older docs[k].subject/body) or the default */
const docRaw=(k,lang)=>{lang=DOCLANGS.includes(lang)?lang:LANG;const c=(window.DOCS||{})[k]||{};const d=DOCDEF[k];
  const own=lang==="de"?(c.de&&(c.de.body||c.de.subject)?c.de:(c.body||c.subject?{subject:c.subject,body:c.body}:null)):(c[lang]&&(c[lang].body||c[lang].subject)?c[lang]:null);
  const def=lang==="de"?{subject:d.subject,body:d.body}:Object.assign({subject:d.subject,body:d.body},(DOCI18N[k]||{})[lang]||(DOCI18N[k]||{}).en||{});
  return {subject:own&&own.subject&&String(own.subject).trim()?own.subject:(def.subject||""),body:own&&own.body&&String(own.body).trim()?own.body:def.body,custom:!!own}};
function docGet(k,v,lang){v=v||{};lang=lang||v.lang||LANG;const r=docRaw(k,lang);
  const map=Object.assign({app:location.origin+location.pathname,disclaimer:k==="disclaimer"?"":docRaw("disclaimer",lang).body,vorname:"",name:"",email:"",passwort:""},v);
  const fill=t=>String(t||"").replace(/\{(\w+)\}/g,(m,x)=>x in map?map[x]:m).replace(/\n{3,}/g,"\n\n").replace(/^(Hallo|Bonjour|Ciao|Hi) \n/,"$1\n");
  return {subject:fill(r.subject),body:fill(r.body)}}
const mailto=(em,k,v)=>{const d=docGet(k,Object.assign({email:em},v));return "mailto:"+encodeURIComponent(em)+"?subject="+encodeURIComponent(d.subject)+"&body="+encodeURIComponent(d.body)};
function docsSec(){
  const dl=DOCLANGS.includes(ADM.doclang)?ADM.doclang:(DOCLANGS.includes(LANG)?LANG:"de");
  return '<div class="admins docs"><h3>'+L("Dokumente")+'</h3><p class="ahint">'+L("Alle Texte, die die App verschickt oder anzeigt. Platzhalter: {vorname} {name} {email} {app} {passwort} {disclaimer}. Du bearbeitest jeweils nur die gewählte Sprache; ohne eigenen Text gilt die Standardfassung.")+'</p>'+
    '<div class="smodes doclangs" role="group">'+DOCLANGS.map(l=>'<button type="button" data-doclang="'+l+'" aria-pressed="'+(l===dl)+'">'+l.toUpperCase()+'</button>').join("")+'</div>'+
    Object.keys(DOCDEF).map(k=>{const d=DOCDEF[k],r=docRaw(k,dl);
      return '<details class="docd" data-sec="doc-'+k+'"'+(SECS["doc-"+k]?' open':'')+'><summary><b>'+esc(L(d.t))+'</b>'+(r.custom?' <span class="ust role">'+L("angepasst")+'</span>':'')+'</summary>'+
        '<form class="docf" data-doc="'+k+'" data-dl="'+dl+'"><p class="ahint">'+esc(L(d.use))+'</p>'+(d.subject!==undefined?'<label>'+L(k==="welcome"?"Titel":"Betreff")+'<input name="ds" maxlength="200" value="'+esc(r.subject)+'"></label>':'')+
        '<label>'+L("Text")+'<textarea name="db" rows="'+(k==="disclaimer"?5:12)+'">'+esc(r.body)+'</textarea></label>'+
        '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Speichern")+'</button>'+(r.custom?'<button type="button" class="lnk" data-docreset="'+k+'" data-dl="'+dl+'">'+L("Standard wiederherstellen")+'</button>':'')+(k!=="welcome"&&k!=="disclaimer"&&ME?'<a class="lnk" href="'+esc(mailto(ME.email,k,{vorname:"Test",name:"Test Person",passwort:"Abc123xyz",lang:dl}))+'">'+L("Test an mich")+'</a>':'')+'</div></form></details>'}).join("")+
    '<p class="ahint">'+L("Bestätigungs-Mail, Passwort-Zurücksetzen und Anmelde-Link verschickt Firebase. Deren Texte änderst du in der Firebase-Konsole unter Authentication → Templates.")+'</p></div>';
}
const docDef=(k,lang)=>lang==="de"?{subject:DOCDEF[k].subject||"",body:DOCDEF[k].body||""}:Object.assign({subject:DOCDEF[k].subject||"",body:DOCDEF[k].body||""},(DOCI18N[k]||{})[lang]||(DOCI18N[k]||{}).en||{});
/* store one language of one document; German also clears the older language-less fields */
async function docStore(k,lang,val){const {F,db}=await fb();const part={[lang]:val};if(lang==="de")Object.assign(part,{body:"",subject:""});
  await F.setDoc(F.doc(db,"config","app"),{docs:{[k]:part}},{merge:true});
  const cur=Object.assign({},(window.DOCS||{})[k]||{},part);window.DOCS=Object.assign({},window.DOCS,{[k]:cur});try{localStorage.setItem("appdocs",JSON.stringify(window.DOCS))}catch(_){}}
document.addEventListener("click",e=>{const b=e.target.closest("[data-doclang]");if(!b)return;ADM.doclang=b.dataset.doclang;render()});
document.addEventListener("submit",async e=>{const f=e.target.closest("form.docf");if(!f)return;e.preventDefault();if(!can("settings"))return;
  const k=f.dataset.doc,lang=DOCLANGS.includes(f.dataset.dl)?f.dataset.dl:"de",msg=f.querySelector(".amsg"),btn=f.querySelector("button[type=submit]");btn.disabled=true;msg.className="amsg";msg.textContent="";
  const val={body:String(f.db.value||"").replace(/\r/g,""),subject:f.ds?String(f.ds.value||"").trim():""};const df=docDef(k,lang);
  if(val.body.trim()===df.body.trim()&&(!f.ds||val.subject===df.subject))val.body="",val.subject="";
  try{await docStore(k,lang,val);
    document.activeElement&&document.activeElement.blur&&document.activeElement.blur();showMsg(L("Gespeichert.")+" ("+lang.toUpperCase()+")",2500);render()}
  catch(err){btn.disabled=false;msg.textContent=(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err))}});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-docreset]");if(!b||!can("settings"))return;const k=b.dataset.docreset,lang=DOCLANGS.includes(b.dataset.dl)?b.dataset.dl:"de";
  try{await docStore(k,lang,{body:"",subject:""});render();showMsg(L("Standardtext wiederhergestellt.")+" ("+lang.toUpperCase()+")",2500)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
/* ---- push notifications for upcoming events: settings in «Mein Konto» (on by default, lead time, which kinds of events),
   every event can be switched off on its own; each device stores its upcoming reminders encrypted in push/{uid}_{device},
   a GitHub run (started every 10 minutes by the Cloudflare Worker) sends the due ones ---- */
const VAPID_PUB="BEP6-lmT3gVm_ZL1R3qiyBzrntxU6dkKtCEbqanP4KjR9xFTTJNtg8Jm1lxWTs7Z2790ZdoNeV4HtNd1jQEjGeo";
const PUSH_LEADS=[[15,"15 Min. vorher"],[30,"30 Min. vorher"],[60,"1 Std. vorher"],[120,"2 Std. vorher"],[180,"3 Std. vorher"],[1440,"1 Tag vorher"]];
const PUSH_TYPES=[["my","Meine Termine","mycal"],["shoot","Alle Drehtage","plan"],["prep","Alle Prep-Termine","prep"]];
function pushCfg(){let c=null;try{c=JSON.parse(localStorage.getItem("push")||"null")}catch(_){}c=c&&typeof c==="object"?c:{};
  return {hint:c.hint||0,on:c.on!==false,lead:PUSH_LEADS.some(x=>x[0]===c.lead)?c.lead:60,types:Object.assign({my:true,shoot:false,prep:false},c.types||{}),off:c.off&&typeof c.off==="object"&&!Array.isArray(c.off)?c.off:{}}}
function pushSave(c){const t=todayISO();for(const k in c.off)if(c.off[k]<t)delete c.off[k];store("push",JSON.stringify(c));pushSyncSoon()}
const pushOK=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
const pushStandalone=()=>{try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(_){return false}};
function pushDev(){let d="";try{d=localStorage.getItem("pushdev")||""}catch(_){}if(!/^[a-z0-9]{10}$/.test(d)){d=Array.from(crypto.getRandomValues(new Uint8Array(10)),x=>"abcdefghijklmnopqrstuvwxyz0123456789"[x%36]).join("");try{localStorage.setItem("pushdev",d)}catch(_){}}return d}
const pushId=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)};
const hmOf=t=>{const m=String(t||"").match(/(\d{1,2}):(\d{2})/);return m?String(+m[1]).padStart(2,"0")+":"+m[2]:""};
/* all events the device would remind of, by kind; each with a stable id */
function pushEvents(c){
  c=c||pushCfg();const out=[],seen=new Set(),t=todayISO(),add=(kind,e)=>{const id=pushId(e.date+"|"+hmOf(e.t)+"|"+(e.n||""));if(seen.has(id))return;seen.add(id);out.push(Object.assign({id,kind},e))};
  try{if(c.types.my&&vok("mycal")&&typeof myIdentity==="function"){const me=myIdentity();if(me)myEvents(me).forEach(e=>add("my",{date:e.date,t:hmOf(e.t),n:e.n,where:e.where||""}))}}catch(err){console.warn("push my",err)}
  try{if(c.types.shoot&&vok("plan"))for(const d of S.days){if(d.kind!=="shoot"||d.date<t)continue;const dp=S.dispos.find(x=>x&&x.date===d.date)||{};
    add("shoot",{date:d.date,t:hmOf(dp.crewCall)||hmOf(dp.generalCall),n:(d.short||d.label||"")+" · "+L("Drehtag"),where:(typeof dayPlaces==="function"?dayPlaces(d).join(", "):"")})}}catch(err){console.warn("push shoot",err)}
  try{if(c.types.prep&&vok("prep"))for(const d of S.prepro){if(d.date<t)continue;for(const i of arr(d.items).concat(arr(d.parallel))){if(!i||!i.n||/^(rest|ruhetag|frei|off|day off)$/i.test(String(i.n).trim()))continue;add("prep",{date:d.date,t:hmOf(i.t),n:i.n,where:i.where||""})}}}catch(err){console.warn("push prep",err)}
  return out.sort((a,b)=>(a.date+(a.t||"08:00")).localeCompare(b.date+(b.t||"08:00")));
}
/* start time of an event (events without a time: 08:00) and when to remind */
const pushStart=e=>new Date(e.date+"T"+(e.t||"08:00")+":00").getTime();
function pushItems(c){c=c||pushCfg();const now=Date.now(),lim=now+15*864e5;
  return pushEvents(c).filter(e=>!c.off[e.id]).map(e=>{const st=pushStart(e),at=st-c.lead*60e3;
    const dt=new Date(st),day=WDL(dt)+" "+String(dt.getDate()).padStart(2,"0")+"."+String(dt.getMonth()+1).padStart(2,"0")+".";
    return {id:e.id,at,start:st,title:e.n||L("Termin"),body:[day+(e.t?" "+e.t:""),e.where].filter(Boolean).join(" · "),url:"./#my"}}).filter(x=>x.start>now&&x.start<lim).slice(0,80)}
let PUSHT=null,PUSHBUSY=false;
function pushSyncSoon(){clearTimeout(PUSHT);PUSHT=setTimeout(()=>pushSync().catch(err=>console.warn("push",err&&err.code||err)),2500)}
async function pushReg(){return navigator.serviceWorker.getRegistration?((await navigator.serviceWorker.getRegistration())||(await navigator.serviceWorker.ready)):navigator.serviceWorker.ready}
const u8=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");s+="===".slice((s.length+3)%4);return Uint8Array.from(atob(s),c=>c.charCodeAt(0))};
async function pushSub(create){const reg=await pushReg();let sub=await reg.pushManager.getSubscription();
  if(!sub&&create)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(VAPID_PUB)});return sub}
async function pushSync(){
  if(!ME||!ME.uid||!pushOK()||PUSHBUSY)return;PUSHBUSY=true;
  try{const c=pushCfg(),{F,db}=await fb(),ref=F.doc(db,"push",ME.uid+"_"+pushDev());let last="";try{last=localStorage.getItem("pushlast")||""}catch(_){}
    if(!c.on||Notification.permission!=="granted"){if(last){await F.deleteDoc(ref).catch(()=>{});try{localStorage.removeItem("pushlast")}catch(_){}}return}
    const sub=await pushSub(true);if(!sub)return;
    let dept="";try{const me=typeof myIdentity==="function"&&myIdentity();dept=me&&me.src||""}catch(_){}
    const pl={on:true,sub:sub.toJSON(),lang:LANG,items:pushItems(c),who:{email:lc(ME.email),role:isOwner()?"owner":isAdmin()?"admin":(MYROLE||""),dept}};const js=JSON.stringify(pl),h=pushId(js)+"|"+Math.floor(Date.now()/216e5);
    if(h===last)return;
    const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(js)));
    const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));
    await F.setDoc(ref,{c:btoa(bin),at:F.serverTimestamp()});try{localStorage.setItem("pushlast",h)}catch(_){}
  }finally{PUSHBUSY=false}
}
async function pushEnable(){
  if(!pushOK())return;const p=await Notification.requestPermission();
  if(p!=="granted"){showMsg(L("Push-Nachrichten wurden im Browser nicht erlaubt."),6000);render();return}
  try{await pushSub(true)}catch(err){console.error(err);showMsg(L("Fehler:")+" "+(err.message||err),6000)}
  const c=pushCfg();c.on=true;try{localStorage.removeItem("pushlast")}catch(_){}pushSave(c);render();
}
async function pushTest(){try{const reg=await pushReg();await reg.showNotification(L("Test-Nachricht"),{body:L("So sehen Erinnerungen an deine Termine aus."),icon:"icon-192.png",badge:"icon-192.png",tag:"test"})}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}}
/* bell in «Meine Termine» rows */
window.pushBell=function(e){const c=pushCfg();if(!c.on||!c.types.my||!pushOK())return "";const id=pushId(e.date+"|"+hmOf(e.t)+"|"+(e.n||""));const off=!!c.off[id];
  return '<button type="button" class="pbell'+(off?' off':'')+'" data-pushev="'+id+'" data-pushdate="'+esc(e.date)+'" aria-pressed="'+(!off)+'" aria-label="'+esc(L(off?"Push-Nachricht einschalten":"Push-Nachricht ausschalten"))+'" title="'+esc(L(off?"Push-Nachricht aus":"Push-Nachricht an"))+'"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'+(off?'<path d="M3 3l18 18"/>':'')+'</svg></button>'};
function pushSec(){
  const c=pushCfg();let dev="";
  if(!pushOK())dev='<p class="ghint">'+L(isIOS()&&!pushStandalone()?"Auf dem iPhone/iPad: zuerst die App über «Teilen → Zum Home-Bildschirm» hinzufügen und von dort öffnen – dann kannst du Push-Nachrichten einschalten.":"Dieser Browser unterstützt keine Push-Nachrichten.")+'</p>';
  else if(Notification.permission==="denied")dev='<p class="ghint">'+L("Push-Nachrichten sind in den Einstellungen dieses Browsers blockiert. Erlaube sie dort für diese Seite.")+'</p>';
  else if(Notification.permission!=="granted")dev='<div class="arb"><button type="button" data-pushon>'+L("Auf diesem Gerät einschalten")+'</button></div>';
  else dev='<p class="ghint pok">✓ '+L("Auf diesem Gerät aktiv")+' <button type="button" class="pillbtn" data-pushtest>'+L("Test-Nachricht")+'</button></p>';
  const types=PUSH_TYPES.filter(x=>vok(x[2]));
  const ev=c.on?pushEvents(c).filter(e=>pushStart(e)>Date.now()).slice(0,40):[];
  return '<section class="psec pushsec"><h4>'+L("Push-Nachrichten")+'</h4>'+
    '<label class="ck"><input type="checkbox" data-pushmaster'+(c.on?' checked':'')+'> '+L("Erinnerungen an kommende Termine erhalten")+'</label>'+
    (c.on?dev+'<label>'+L("Erinnern")+'<select data-pushlead>'+PUSH_LEADS.map(([v,t])=>'<option value="'+v+'"'+(v===c.lead?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>'+
      '<p class="ahint"><b>'+L("Für welche Termine?")+'</b></p>'+types.map(([k,t])=>'<label class="ck"><input type="checkbox" data-pushtype="'+k+'"'+(c.types[k]?' checked':'')+'> '+L(t)+'</label>').join("")+
      '<details class="pushlist" data-sec="pushlist"'+(SECS.pushlist?' open':'')+'><summary>'+L("Kommende Termine")+' ('+ev.filter(e=>!c.off[e.id]).length+'/'+ev.length+')</summary>'+
      (ev.length?ev.map(e=>{const dt=new Date(e.date+"T12:00:00");return '<label class="ck pev"><input type="checkbox" data-pushev2="'+e.id+'" data-pushdate="'+esc(e.date)+'"'+(c.off[e.id]?'':' checked')+'> <span><b>'+WDL(dt)+' '+String(dt.getDate()).padStart(2,"0")+'.'+String(dt.getMonth()+1).padStart(2,"0")+'.'+(e.t?' '+esc(e.t):'')+'</b> '+esc(e.n||"")+'</span></label>'}).join(""):'<p class="ghint">'+L("Keine kommenden Termine gefunden.")+'</p>')+
      '<p class="ahint">'+L("Hier oder mit der Glocke in «Meine Termine» schaltest du einzelne Termine aus.")+'</p></details>':'')+
    '</section>';
}
function pushToggleEv(id,date,on){const c=pushCfg();if(on)delete c.off[id];else c.off[id]=date||todayISO();pushSave(c)}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-pushev]");if(b){e.preventDefault();e.stopPropagation();pushToggleEv(b.dataset.pushev,b.dataset.pushdate,b.classList.contains("off"));render();return}
  if(e.target.closest("[data-pushon]")){pushEnable();return}
  if(e.target.closest("[data-pushtest]")){pushTest();return}},true);
document.addEventListener("change",e=>{const t=e.target;
  if(t.matches("[data-pushmaster]")){const c=pushCfg();c.on=t.checked;pushSave(c);render()}
  else if(t.matches("[data-pushlead]")){const c=pushCfg();c.lead=+t.value;pushSave(c)}
  else if(t.matches("[data-pushtype]")){const c=pushCfg();c.types[t.dataset.pushtype]=t.checked;pushSave(c);render()}
  else if(t.matches("[data-pushev2]")){pushToggleEv(t.dataset.pushev2,t.dataset.pushdate,t.checked);const s=t.closest("details").querySelector("summary");if(s){const c=pushCfg(),ev=pushEvents(c).filter(x=>pushStart(x)>Date.now()).slice(0,40);s.textContent=L("Kommende Termine")+" ("+ev.filter(x=>!c.off[x.id]).length+"/"+ev.length+")"}}});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")pushSyncSoon()});
/* opened from a notification: go to «Meine Termine» */
if(location.hash==="#my"){try{history.replaceState(null,"",location.pathname+location.search)}catch(_){}setTimeout(()=>{if(typeof openMyCal==="function")openMyCal()},400)}
if("serviceWorker" in navigator)navigator.serviceWorker.addEventListener("message",e=>{if(e.data&&e.data.open==="my"&&typeof openMyCal==="function")openMyCal()});
/* ---- chat assistant: asks Claude through the production's Cloudflare Worker (config/app.chatUrl); every person can switch it off in «Mein Konto» ---- */
window.CHATURL="";window.CHATEN=true;window.TOUREN=true;try{window.CHATURL=localStorage.getItem("appchat")||"";window.CHATEN=localStorage.getItem("appchaton")!=="0";window.TOUREN=localStorage.getItem("apptouron")!=="0"}catch(_){}
const chatOn=()=>{let v=null;try{v=localStorage.getItem("chat")}catch(_){}return v!=="0"};
const CHAT={open:false,busy:false,msgs:[]};try{CHAT.msgs=JSON.parse(sessionStorage.getItem("chatmsgs")||"[]")||[]}catch(_){}
const APPHELP=`So ist die App aufgebaut (unten die Bereiche, oben die Knöpfe):
- Schedule: Drehplan Tag für Tag mit Szenen, Motiven, Units (1st/2nd Unit); Knopf «Script» öffnet die Szene im Drehbuch, Kamera-Knopf zeigt Blocking-Fotos/Filme, Zahlen-Knöpfe öffnen Floorplans (PDF).
- Callsheet: Dispo des Tages (Crew Call, Drehbeginn, Wrap, Locations, Cast, Abteilungen).
- Locations: alle Motive mit Adresse, Karte und Szenen.
- Crew: Crewliste nach Abteilungen (Telefon/E-Mail nur mit Berechtigung), Catering-Übersicht, Geburtstage.
- Script: das Drehbuch mit Suche.
- Info: allgemeine Infos.
- Lupe oben: Suche über alles. Kalender-Symbol: «Meine Termine» (eigene Termine, mit «In den Kalender» und Push-Glocke). Personen-Symbol: «Mein Konto» (Profil, Push-Nachrichten, Darstellung hell/dunkel, Passwort, Abmelden, Tour neu starten). Zahnrad: App-Verwaltung (nur mit Berechtigung).
- Daten kommen automatisch aus der Dropbox der Produktion.`;
function chatCtx(){
  const out=[APPHELP];const J=x=>JSON.stringify(x,(k,v)=>v===""||v===null||(Array.isArray(v)&&!v.length)?undefined:v);
  try{if(vok("plan"))out.push("DREHPLAN (days): "+J(S.days))}catch(_){}
  try{if(vok("dispo"))out.push("CALLSHEETS (dispos): "+J(S.dispos))}catch(_){}
  try{if(vok("prep"))out.push("PREP / WEEKLY SCHEDULE: "+J(S.prepro))}catch(_){}
  try{out.push("LOCATIONS: "+J(S.locs))}catch(_){}
  try{const ph=vok("phone"),em=vok("email");out.push("CREWLISTE: "+J(S.crew.map(g=>Object.assign({},g,{people:arr(g.people).map(p=>{const q=Object.assign({},p);if(!ph){delete q.phone;delete q.tel;delete q.mobile}if(!em)delete q.email;return q})}))))}catch(_){}
  try{if(vok("mycal")&&typeof myIdentity==="function"){const me=myIdentity();if(me)out.push("MEINE TERMINE ("+me.name+"): "+J(myEvents(me).map(e=>({date:e.date,t:e.t,end:e.end,n:e.n,where:e.where,src:e.src}))))}}catch(_){}
  return out.join("\n\n");
}
function chatFab(){
  let b=document.getElementById("chatFab");const g=document.getElementById("gate"),show=!!(ME&&window.CHATURL&&window.CHATEN&&chatOn()&&!ONBOARD&&!WELCOME_OPEN&&(!g||g.hidden));
  if(!b){b=document.createElement("button");b.id="chatFab";b.type="button";b.className="chatfab";
    b.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"/></svg>';
    b.addEventListener("click",()=>{CHAT.open=!CHAT.open;chatPanel()});document.body.appendChild(b)}
  b.setAttribute("aria-label",L("Assistent"));b.title=L("Assistent");b.hidden=!show;if(!show&&CHAT.open){CHAT.open=false;chatPanel()}
}
const chatMd=t=>esc(t).replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/(^|\n)- /g,"$1• ").replace(/(https:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,"<br>");
function chatPanel(){
  let p=document.getElementById("chatBox");
  if(!CHAT.open){if(p)p.hidden=true;return}
  if(!p){p=document.createElement("div");p.id="chatBox";p.className="chatbox";p.setAttribute("role","dialog");p.setAttribute("aria-label",L("Assistent"));document.body.appendChild(p);
    p.addEventListener("submit",e=>{e.preventDefault();const i=p.querySelector("textarea");const q=String(i.value||"").trim();if(q&&!CHAT.busy){i.value="";chatAsk(q)}});
    p.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&e.target.matches("textarea")){e.preventDefault();p.querySelector("form").requestSubmit()}});
    p.addEventListener("click",e=>{if(e.target.closest("[data-chatx]")){CHAT.open=false;chatPanel()}else if(e.target.closest("[data-chatclr]")){CHAT.msgs=[];chatKeep();chatPanel()}else{const s=e.target.closest("[data-chatq]");if(s&&!CHAT.busy)chatAsk(s.dataset.chatq)}})}
  const sug=["Wann ist mein nächster Termin?","Wo drehen wir morgen?","Wer ist die Regie?","Wie funktioniert Meine Termine?"];
  p.innerHTML='<div class="chhd"><b>'+L("Assistent")+'</b><span class="chbeta">BETA</span>'+(CHAT.msgs.length?'<button type="button" class="lnk" data-chatclr>'+L("Neu")+'</button>':'')+'<button type="button" class="chx" data-chatx aria-label="'+esc(L("Schliessen"))+'">×</button></div>'+
    '<div class="chmsgs">'+(CHAT.msgs.length?'':'<p class="ghint">'+L("Frag mich etwas zum Drehplan, zu Locations, zur Crew oder zur App.")+'</p><div class="chsug">'+sug.map(q=>'<button type="button" data-chatq="'+esc(L(q))+'">'+esc(L(q))+'</button>').join("")+'</div>')+
    CHAT.msgs.map(m=>'<div class="chm '+(m.r==="u"?"me":m.r==="e"?"err":"bot")+'">'+(m.r==="u"?esc(m.t).replace(/\n/g,"<br>"):chatMd(m.t))+'</div>').join("")+(CHAT.busy?'<div class="chm bot busy"><span></span><span></span><span></span></div>':'')+'</div>'+
    '<form class="chin"><textarea rows="1" maxlength="2000" placeholder="'+esc(L("Frage eingeben …"))+'" aria-label="'+esc(L("Frage"))+'"></textarea><button type="submit" aria-label="'+esc(L("Senden"))+'"'+(CHAT.busy?' disabled':'')+'>➤</button></form>'+
    '<p class="chnote">'+L("Antworten ohne Gewähr – verbindlich sind die Unterlagen der Produktion.")+'</p>';
  p.hidden=false;const ms=p.querySelector(".chmsgs");ms.scrollTop=ms.scrollHeight;if(!CHAT.busy&&matchMedia("(pointer:fine)").matches)p.querySelector("textarea").focus();
}
function chatKeep(){try{sessionStorage.setItem("chatmsgs",JSON.stringify(CHAT.msgs.slice(-30)))}catch(_){}}
async function chatAsk(q){
  CHAT.msgs.push({r:"u",t:q});CHAT.busy=true;chatKeep();chatPanel();
  try{const {auth}=await fb();const tok=await auth.currentUser.getIdToken();
    const r=await withTimeout(fetch(window.CHATURL.replace(/\/+$/,"")+"/chat",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},
      body:JSON.stringify({q,lang:LANG,today:new Date().toLocaleString("de-CH",{weekday:"long",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}),who:(MEMBER&&MEMBER.name||"")+" <"+ME.email+">",
        hist:CHAT.msgs.slice(0,-1).filter(m=>m.r!=="e").slice(-10),ctx:chatCtx()})}),60000,"chat");
    const j=await r.json().catch(()=>({}));
    CHAT.msgs.push(r.ok&&j.a?{r:"a",t:j.a}:{r:"e",t:L("Fehler:")+" "+(j.error||r.status)})}
  catch(err){CHAT.msgs.push({r:"e",t:L(navigator.onLine===false?"Keine Verbindung.":"Der Assistent ist gerade nicht erreichbar.")})}
  CHAT.busy=false;chatKeep();chatPanel();
}
function chatSec(){if(!window.CHATURL||!window.CHATEN)return "";
  return '<section class="psec"><h4>'+L("Assistent")+'</h4><label class="ck"><input type="checkbox" data-chaton'+(chatOn()?' checked':'')+'> '+L("Chat-Assistent anzeigen (Knopf unten rechts)")+'</label></section>'}
function chatSetSec(){
  return '<p class="ahint"><b>'+L("Einführungstour")+'</b> – '+L("Eingeschaltet wird die Tour allen einmalig angeboten und kann unter «Mein Konto» neu gestartet werden.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="to"'+(window.TOUREN!==false?' checked':'')+'> '+L("Einführungstour anbieten")+'</label></div>'+
    '<p class="ahint"><b>'+L("Assistent")+'</b> – '+L("Adresse des Cloudflare Workers für den Chat-Assistenten (und den zuverlässigen Zeitplan für Push und Dropbox). Leer = kein Assistent.")+' <a href="https://github.com/furtschellas/Tschugger/blob/main/tools/chat_worker.js" target="_blank" rel="noopener">'+L("Worker-Code und Anleitung")+'</a></p><input form="setform" class="amap" type="url" name="chat" inputmode="url" placeholder="https://tschugger.….workers.dev" value="'+esc(window.CHATURL||"")+'"><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="ca"'+(window.CHATEN!==false?' checked':'')+'> '+L("KI-Assistent anbieten")+'</label></div>'}
document.addEventListener("change",e=>{if(e.target.matches("[data-chaton]")){store("chat",e.target.checked?"1":"0");chatFab()}});
setInterval(()=>{try{chatFab()}catch(_){}},1500);
/* ---- introduction tour: offered once to everybody (new and existing users) after the welcome note; can be skipped;
   the result (done/skip + date) is kept in the profile (members.tour/tourAt); «Mein Konto» starts it again ---- */
const TOUR_STEPS=[
  {tab:"plan",sel:'nav.tabs [data-tab="plan"]',t:"Schedule",x:"Der Drehplan Tag für Tag: Szenen, Motive und Zeiten. Mit «Script» öffnest du eine Szene im Drehbuch, die Kamera zeigt Blocking-Fotos und -Filme."},
  {tab:"plan",day:"shoot",sel:"#view .stripwrap",t:"Tage wählen",x:"Wische durch die Tage: PREP, OFF, TRAVEL und die Drehtage D01, D02 … Heute ist hervorgehoben."},
  {tab:"plan",day:"shoot",sel:"#view .dayhead .pvb",t:"Anzeigeoptionen",x:"Blende im Drehplan ein oder aus, was du sehen willst: Info, Szenenbeschrieb, Cast, Adresse und Blocking. Deine Auswahl bleibt gespeichert."},
  {tab:"plan",day:"shoot",sel:"#view .dayhead .dpub",t:"1st / 2nd Unit",x:"Wähle, welche Units du siehst – zum Beispiel nur die 2nd Unit. Ist eine Unit an diesem Tag nicht im Einsatz, ist ihr Knopf blass."},
  {tab:"plan",day:"prep",sel:"#view .ppi .calbtn:not(.mailbtn)",t:"Termin in den Kalender",x:"Mit dem Kalender-Knopf übernimmst du einen Termin direkt in deinen Kalender (Handy oder Computer)."},
  {tab:"plan",day:"prep",sel:"#view .ppi .mailbtn",t:"E-Mail-Verteiler",x:"Der Brief-Knopf öffnet eine E-Mail an alle Teilnehmenden dieses Termins – praktisch für kurzfristige Infos."},
  {tab:"dispo",sel:'nav.tabs [data-tab="dispo"]',t:"Callsheet",x:"Die Dispo des Drehtags: Crew Call, Drehbeginn, Wrap, Locations und Cast."},
  {tab:"dispo",sel:"#view .dpub",t:"Unit filtern",x:"Auch im Callsheet wählst du oben den Tag und filterst nach Unit."},
  {tab:"loc",sel:'nav.tabs [data-tab="loc"]',t:"Locations",x:"Alle Motive mit Adresse, Karte und den Szenen, die dort gedreht werden."},
  {tab:"loc",sel:"#view .scall",up:1,t:"Optionen",x:"«Szenen» klappt alle Szenen auf oder zu; daneben blendest du Info und Adresse ein und filterst nach Unit."},
  {tab:"loc",sel:"#view input.search",t:"Suche",x:"Suche nach Motiv, Adresse oder Szene."},
  {tab:"crew",sel:'nav.tabs [data-tab="crew"]',t:"Crew",x:()=>L("Die Crewliste nach Abteilungen.")+(vok("phone")||vok("email")?" "+L("Mit Telefon und E-Mail – ein Tipp genügt zum Anrufen oder Schreiben."):"")},
  {tab:"crew",sel:"#view input.search",t:"Crew durchsuchen",x:"Suche nach Name, Funktion oder Abteilung. Mit «vCard» speicherst du einen Kontakt direkt im Telefon."},
  {tab:"crew",sel:"#view .admv",t:"Zusatzinfos",x:"Je nach Berechtigung: Essen, Geburtstage, Kontoinfos und alle Kontakte als VCF."},
  {tab:"script",sel:'nav.tabs [data-tab="script"]',t:"Script",x:"Das Drehbuch mit Suche."},
  {tab:"script",sel:"#view .pvbtn",up:1,t:"Anzeigeoptionen",x:"Blende Infobox, Drehtag & Zeit, englische Szenenbezeichnung, Cast, Adresse und Blocking ein oder aus."},
  {tab:"script",sel:"#view .smodes",t:"Suchen nach",x:"Suche im Drehbuch gezielt nach Rolle, Szene, Drehtag, Person, Motiv oder Text."},
  {tab:"cater",sel:'nav.tabs [data-tab="cater"]',t:"Catering",x:"Alle Essenswünsche, Unverträglichkeiten und Allergien der Crew auf einen Blick."},
  {tab:"info",sel:'nav.tabs [data-tab="info"]',t:"Info",x:"Allgemeine Infos zur Produktion und zur App."},
  {tab:"plan",sel:"header .lang",demo:"lang",t:"Sprache",x:"Hier wechselst du die Sprache der App – so sieht sie zum Beispiel auf Englisch aus. Mit «Weiter» geht es in deiner Sprache weiter."},
  {tab:"plan",sel:"#thmb",demo:"theme",t:"Hell / Dunkel",x:"Mit der Sonne wechselst du zwischen dunkler und heller Darstellung – hell ist draussen bei Sonne gut lesbar. Mit «Weiter» kommt deine Einstellung zurück."},
  {tab:"plan",sel:"#searchBtn",t:"Suche",x:"Sucht über alles: Szenen, Rollen, Personen, Locations."},
  {tab:"my",sel:"#myCalBtn",t:"Meine Termine",x:"Alle deine kommenden Termine an einem Ort – mit «In den Kalender» und der Glocke für Push-Nachrichten."},
  {tab:"my",sel:"#view [data-mcall]",t:"Kalender-Export",x:"«Alle in den Kalender» übernimmt alle deine Termine auf einmal; mit dem Kalender-Knopf bei jedem Termin einzeln."},
  {tab:"my",sel:"#view .pbell",t:"Push-Glocke",x:"Mit der Glocke schaltest du die Erinnerung für einzelne Termine aus oder ein."},
  {tab:"plan",sel:"#bcBtn",t:"Push-Nachricht senden",x:"Mit dem Briefumschlag schickst du sofort eine Push-Nachricht an alle – oder nur an bestimmte Rollen und Abteilungen."},
  {tab:"acct",sel:"#acctBtn",t:"Mein Konto",x:"Profil, Push-Nachrichten, hell/dunkel, Passwort und Abmelden. Hier kannst du diese Tour jederzeit neu starten."},
  {tab:"acct",sel:"#view .pushsec",t:"Push-Nachrichten",x:"Hier stellst du ein, ob, wann und für welche Termine du erinnert wirst."},
  {tab:"plan",sel:"#admBtn",t:"App-Verwaltung",x:()=>{const a=[];if(can("users.view")||can("users.invite")||can("users.requests")||can("users.edit"))a.push(L("Benutzer"));if(isOwner())a.push(L("Rollen"));if(can("settings"))a.push(L("Dokumente"),L("Einstellungen"));return L("Deine Verwaltung:")+" "+a.join(", ")+"."}},
  {tab:"plan",sel:"#chatFab",t:"Assistent",x:"Frag den Assistenten, z. B. «Wo drehen wir morgen?» – er kennt die Daten der App."}
];
const TOUR={i:-1,steps:[],el:null};
const tourEl=st=>{let e=document.querySelector(st.sel);for(let k=0;e&&k<(st.up||0);k++)e=e.parentElement;if(!e||e.hidden||e.closest("[hidden]"))return null;const r=e.getBoundingClientRect();return r.width&&r.height?e:null};
function tourDay(kind){const t=todayISO();if(kind==="shoot"){const sd=S.days.filter(x=>x.kind==="shoot");const d=sd.find(x=>x.date>=t)||sd[0];return d?d.id:null}
  if(kind==="prep"){const pp=(S.prepro||[]).filter(d=>arr(d.items).some(i=>i.crew||i.cast));const d=pp.find(x=>x.date>=t)||pp[0];return d?"prep:"+d.date:null}return null}
/* demonstrations (language, light/dark) are undone as soon as the step is left */
function tourDemo(st){
  const want=st&&st.demo,o=TOUR.orig||(TOUR.orig={});
  if(o.lang&&want!=="lang"){LANG=o.lang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;delete o.lang;render()}
  if(o.theme&&want!=="theme"){setTheme(o.theme);delete o.theme}
  if(want==="lang"&&!o.lang){const to=(APPLANGS||[]).find(l=>l!==LANG&&l==="en")||(APPLANGS||[]).find(l=>l!==LANG);if(to){o.lang=LANG;LANG=to;applyStatic();render()}}
  if(want==="theme"&&!o.theme){o.theme=getTheme();setTheme(o.theme==="dark"?"light":"dark")}
}
function tourShow(st){if(st.day){const id=tourDay(st.day);if(id&&S.day!==id){S.day=id;if(S.tab===st.tab)render()}}if(S.tab!==st.tab){S.tab=st.tab;S.srcOpen=false;render()}else if(st.day)render();window.scrollTo(0,0);const e=tourEl(st);if(e){const r=e.getBoundingClientRect();if(r.bottom>innerHeight-70||r.top<0)e.scrollIntoView({block:"center"})}return e}
function tourDoneLocal(){try{return !!(localStorage.getItem("tourDone:"+(ME&&ME.uid))||localStorage.getItem("tour"))}catch(_){return false}}
/* the tour starts by itself only once per person: marked right when it is offered (this device, the synced view settings and the profile) */
async function tourMark(how){
  const at=new Date().toISOString(),v=how+"|"+at;try{localStorage.setItem("tourDone:"+(ME&&ME.uid),v)}catch(_){}store("tour",v);
  try{if(MEMBER&&ME){const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{tour:how,tourAt:at});MEMBER.tour=how;MEMBER.tourAt=at}}catch(err){console.warn("tour",err&&err.code||err)}
}
async function maybeTour(){
  if(!ME||ONBOARD||WELCOME_OPEN||TOUR.el||TOUR.pending)return;
  if(!window.TOUREN||(MEMBER&&MEMBER.tour)||tourDoneLocal()){setTimeout(maybePushHint,800);return}
  TOUR.pending=true;setTimeout(()=>{TOUR.pending=false;if(!TOUR.el&&!tourDoneLocal()&&!(MEMBER&&MEMBER.tour)){tourMark("shown");tourStart(true)}},700);
}
function tourStart(ask){
  if(TOUR.el)TOUR.el.remove();if(CHAT.open){CHAT.open=false;chatPanel()}
  TOUR.prev={tab:S.tab,day:S.day};
  /* show a shooting day so the display options and unit buttons can be explained */
  {const t=todayISO(),cur=S.days.find(x=>x.id===S.day);if(S.tab!=="plan"||!cur||cur.kind!=="shoot"){const sd=S.days.filter(x=>x.kind==="shoot");const d=sd.find(x=>x.date>=t)||sd[0];S.tab="plan";if(d)S.day=d.id;render()}}
  {const keep=S.tab,navOn=t=>{const b=document.querySelector('nav.tabs [data-tab="'+t+'"]');return !!(b&&!b.hidden)};
    TOUR.steps=TOUR_STEPS.filter(st=>{try{return !!tourShow(st)||(st.sel.startsWith("#view")&&navOn(st.tab))}catch(_){return false}});S.tab=keep;render()}
  window.scrollTo(0,0);TOUR.i=ask?-1:0;
  const o=document.createElement("div");o.id="tour";o.className="tour";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");o.innerHTML='<div class="tspot"></div><div class="tcard" role="document"></div>';
  o.addEventListener("click",e=>{const b=e.target.closest("[data-tour]");if(!b)return;const a=b.dataset.tour;
    if(a==="next")tourGo(TOUR.i+1);else if(a==="back")tourGo(TOUR.i-1);else if(a==="skip")tourEnd("skip");else if(a==="done")tourEnd("done")});
  document.body.appendChild(o);TOUR.el=o;tourGo(TOUR.i);
  addEventListener("resize",tourPlace);
}
function tourGo(i){
  const o=TOUR.el;if(!o)return;TOUR.i=i;const n=TOUR.steps.length,c=o.querySelector(".tcard"),sp=o.querySelector(".tspot");
  if(i<0||i>=n)tourDemo(null);
  if(i<0){sp.hidden=true;c.className="tcard center";
    c.innerHTML='<h3>'+L("Kurze Tour durch die App?")+'</h3><p>'+L("In einer Minute zeigen wir dir die wichtigsten Funktionen. Du kannst die Tour später jederzeit unter «Mein Konto» starten.")+'</p><div class="tbtns"><button type="button" class="lnk" data-tour="skip">'+L("Überspringen")+'</button><button type="button" class="pri" data-tour="next">'+L("Tour starten")+'</button></div>';return}
  if(i>=n){sp.hidden=true;c.className="tcard center";
    c.innerHTML='<h3>'+L("Fertig!")+'</h3><p>'+L("Viel Spass mit der App. Die Tour findest du jederzeit wieder unter «Mein Konto».")+'</p><div class="tbtns"><button type="button" class="pri" data-tour="done">'+L("Los geht's")+'</button></div>';return}
  const s=TOUR.steps[i];tourDemo(s);if(!tourShow(s)){const dir=i>=(TOUR.last==null?-1:TOUR.last)?1:-1;TOUR.steps.splice(i,1);return tourGo(dir>0?i:i-1)}TOUR.last=i;sp.hidden=false;c.className="tcard";
  c.innerHTML='<div class="tprog">'+(i+1)+' / '+n+'</div><h3>'+esc(L(s.t))+'</h3><p>'+esc(typeof s.x==="function"?s.x():L(s.x))+'</p><div class="tbtns"><button type="button" class="lnk" data-tour="skip">'+L("Überspringen")+'</button><span></span>'+(i>0?'<button type="button" class="sec" data-tour="back">'+L("Zurück")+'</button>':'')+'<button type="button" class="pri" data-tour="next">'+L(i===n-1?"Fertig":"Weiter")+'</button></div>';
  tourPlace();try{c.querySelector(".pri").focus({preventScroll:true})}catch(_){}
}
function tourPlace(){
  const o=TOUR.el;if(!o||TOUR.i<0||TOUR.i>=TOUR.steps.length)return;const e=tourEl(TOUR.steps[TOUR.i]);if(!e)return;
  const r=e.getBoundingClientRect(),pad=6,sp=o.querySelector(".tspot"),c=o.querySelector(".tcard");
  Object.assign(sp.style,{left:(r.left-pad)+"px",top:(r.top-pad)+"px",width:(r.width+2*pad)+"px",height:(r.height+2*pad)+"px"});
  const vh=innerHeight,vw=innerWidth,cw=Math.min(340,vw-24);c.style.width=cw+"px";
  const ch=c.offsetHeight||170,below=r.bottom+14+ch<vh-8,above=r.top-14-ch>8;
  c.style.top=(below?r.bottom+14:above?r.top-14-ch:Math.max(8,vh-ch-90))+"px";
  c.style.left=Math.min(vw-cw-12,Math.max(12,r.left+r.width/2-cw/2))+"px";
}
async function tourEnd(how){
  tourDemo(null);if(TOUR.el){TOUR.el.remove();TOUR.el=null}removeEventListener("resize",tourPlace);
  if(TOUR.prev){if(TOUR.prev.day)S.day=TOUR.prev.day;S.tab=["acct","admin"].includes(TOUR.prev.tab)?TOUR.prev.tab:"plan";render();window.scrollTo(0,0)}TOUR.prev=null;setTimeout(maybePushHint,800);
  tourMark(how);
  if(how==="skip")showMsg(L("Tour übersprungen – du findest sie unter «Mein Konto».")+"",4000);
}

/* one-time note about push notifications (existing and new users), with a short setup right in the note */
function maybePushHint(){
  if(!ME||ONBOARD||WELCOME_OPEN||TOUR.el||document.getElementById("pushhint"))return;const c=pushCfg();if(c.hint)return;
  const ios=!pushOK()&&isIOS()&&!pushStandalone();if(!pushOK()&&!ios)return;
  if(pushOK()&&Notification.permission!=="default"){c.hint=1;pushSave(c);return}
  const d=document.createElement("div");d.id="pushhint";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  const types=PUSH_TYPES.filter(x=>vok(x[2]));
  d.innerHTML='<div class="a2box phbox"><span class="wlbeta">'+L("Neu")+'</span><h3>'+L("Push-Nachrichten")+'</h3><p>'+L("Die App erinnert dich jetzt auf Wunsch vor deinen Terminen – auch wenn sie geschlossen ist.")+'</p>'+
    (ios?'<p class="ghint">'+L("Auf dem iPhone/iPad: zuerst die App über «Teilen → Zum Home-Bildschirm» hinzufügen und von dort öffnen – dann kannst du Push-Nachrichten einschalten.")+'</p><div class="a2b"><button type="button" class="pri" data-ph="ok">'+L("OK")+'</button></div>':
    '<label class="phl">'+L("Erinnern")+'<select data-phlead>'+PUSH_LEADS.map(([v,t])=>'<option value="'+v+'"'+(v===c.lead?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>'+
    '<p class="ahint"><b>'+L("Für welche Termine?")+'</b></p>'+types.map(([k,t])=>'<label class="ck"><input type="checkbox" data-phtype="'+k+'"'+(c.types[k]?' checked':'')+'> '+L(t)+'</label>').join("")+
    '<p class="ghint">'+L("Einzelne Termine schaltest du mit der Glocke in «Meine Termine» aus; alles Weitere unter «Mein Konto».")+'</p>'+
    '<div class="a2b"><button type="button" class="lnk" data-ph="no">'+L("Nicht jetzt")+'</button><button type="button" class="pri" data-ph="on">'+L("Einschalten")+'</button></div>')+'</div>';
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-ph]");if(!b){if(e.target.closest("button")&&!e.target.closest("select")){const c=pushCfg();c.hint=1;pushSave(c);d.remove()}return}const c=pushCfg();c.hint=1;
    if(b.dataset.ph==="on"){c.lead=+(d.querySelector("[data-phlead]")||{value:c.lead}).value||c.lead;d.querySelectorAll("[data-phtype]").forEach(x=>c.types[x.dataset.phtype]=x.checked);c.on=true;pushSave(c);d.remove();await pushEnable();if(Notification.permission==="granted")showMsg(L("Push-Nachrichten sind eingeschaltet."),3500)}
    else{pushSave(c);d.remove();if(b.dataset.ph==="no")showMsg(L("Du kannst Push-Nachrichten jederzeit unter «Mein Konto» einschalten."),4000)}});
  document.body.appendChild(d);
}
const tourInfo=m=>!m?"":m.tour==="done"?L("Tour gemacht"):m.tour==="skip"?L("Tour übersprungen"):m.tour==="shown"?L("Tour angefangen"):L("Tour offen");
/* ---- push message to everybody (or selected roles / departments), sent right away: permission «push.send».
   The message is stored encrypted in broadcasts/{id}; the Cloudflare Worker starts the sending run at once ---- */
const BC={roles:null,sel:{roles:[],depts:[]},mode:"all",busy:false,msg:"",ok:false};
function bcButton(){
  let b=document.getElementById("bcBtn");const mc=document.getElementById("myCalBtn");if(!mc)return;
  if(!b){b=document.createElement("button");b.id="bcBtn";b.className="refresh";b.type="button";
    b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>';
    mc.parentNode.insertBefore(b,mc.nextSibling);b.addEventListener("click",()=>{S.tab="bcast";S.srcOpen=false;window.scrollTo(0,0);render()})}
  b.setAttribute("aria-label",L("Push-Nachricht senden"));b.title=L("Push-Nachricht senden");b.hidden=!(ME&&can("push.send"));
}
setInterval(()=>{try{bcButton()}catch(_){}},1500);
function bcDepts(){return [...new Set((S.crew||[]).map(g=>g.dept).filter(Boolean))]}
async function bcLoadRoles(){if(BC.roles)return;BC.roles=[];try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"roles"));BC.roles=q.docs.filter(d=>d.id!=="admin").map(d=>({id:d.id,name:String(d.data().name||d.id)})).sort((a,b)=>a.name.localeCompare(b.name,LANG))}catch(_){}render()}
/* send right away through the Cloudflare Worker; without it the next run picks the message up */
async function bcDeliver(id){
  const {F,db,auth}=await fb();
  if(window.CHATURL){try{const tok=await auth.currentUser.getIdToken();
    const r=await fetch(window.CHATURL.replace(/\/+$/,"")+"/broadcast",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+tok},body:JSON.stringify({id})});const j=await r.json().catch(()=>({}));
    if(r.ok){try{await F.updateDoc(F.doc(db,"broadcasts",id),{sent:true,n:j.n||0})}catch(_){}return L("Gesendet an {n} Geräte.").replace("{n}",j.n||0)}
    await fetch(window.CHATURL.replace(/\/+$/,"")+"/notify",{method:"POST",headers:{Authorization:"Bearer "+tok}}).catch(()=>{});return L("Gesendet – die Nachricht kommt in etwa einer Minute an.")}catch(_){}}
  return L("Gespeichert – die Nachricht geht mit dem nächsten Lauf (spätestens in 15 Minuten) raus.");
}
/* history: every message with date, time, recipients and sender; can be sent again */
async function bcLoadHist(){BC.hist=[];try{const {F,db}=await fb();const q=await F.getDocs(F.collection(db,"broadcasts"));const key=await getDataKey();
  const out=[];for(const d of q.docs){try{const raw=Uint8Array.from(atob(d.data().c),ch=>ch.charCodeAt(0));const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:raw.slice(0,12)},key,raw.slice(12));out.push(Object.assign({id:d.id,sent:d.data().sent,n:d.data().n},JSON.parse(new TextDecoder().decode(pt))))}catch(_){}}
  BC.hist=out.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,100)}catch(err){console.warn("bc hist",err&&err.code||err);BC.histErr=String((err&&err.code)||err)}render()}
const bcWho=b=>b.roles||b.depts?[].concat((b.roles||[]).map(r=>r==="owner"?L("Owner"):r==="admin"?L("Admin"):r===""?L("Keine Rolle"):((BC.roles||[]).find(x=>x.id===r)||{}).name||r),(b.depts||[]).map(HIT)).join(", "):L("Alle");
function bcHistHTML(){
  if(!BC.hist){bcLoadHist();return '<p class="ghint">'+L("Lade …")+'</p>'}
  if(!BC.hist.length)return '<p class="ghint">'+L("Noch keine Push-Nachrichten gesendet.")+'</p>';
  return '<div class="bchist">'+BC.hist.map(b=>{const dt=new Date(b.at||0);
    return '<div class="bch"><div class="bchd"><span class="bct">'+esc(dt.toLocaleDateString(LOC[LANG]||"de-CH",{day:"2-digit",month:"2-digit",year:"numeric"}))+' · '+esc(dt.toLocaleTimeString(LOC[LANG]||"de-CH",{hour:"2-digit",minute:"2-digit"}))+'</span>'+(b.n!=null?'<span class="ust role">'+esc(L("{n} Geräte").replace("{n}",b.n))+'</span>':'')+'</div>'+
      '<b class="bctt">'+esc(b.title||"")+'</b><p class="bcb">'+esc(b.body||"")+'</p>'+
      '<div class="bcm"><span>'+esc(L("An"))+': '+esc(bcWho(b))+'</span><span>'+esc(L("Von"))+': '+esc(b.by||"")+'</span></div>'+
      '<div class="arb"><button type="button" class="pillbtn" data-bcre="'+esc(b.id)+'">↻ '+L("Erneut senden")+'</button></div></div>'}).join("")+'</div>';
}
document.addEventListener("click",async e=>{const bt=e.target.closest("[data-bcre]");if(!bt||!can("push.send")||BC.busy)return;const b=(BC.hist||[]).find(x=>x.id===bt.dataset.bcre);if(!b)return;
  if(!confirmSafe(L("Push-Nachricht jetzt senden an:")+" "+bcWho(b)+"?"))return;BC.busy=true;bt.disabled=true;
  try{const pl={title:b.title,body:b.body,roles:b.roles||null,depts:b.depts||null,by:ME.email,at:Date.now(),re:b.id};
    const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(pl))));
    const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));
    const {F,db}=await fb();const ref=await F.addDoc(F.collection(db,"broadcasts"),{c:btoa(bin),at:F.serverTimestamp()});showMsg(await bcDeliver(ref.id),5000);BC.hist=null}
  catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}BC.busy=false;render()});
VIEWS.bcast=function(){
  if(!ME||!can("push.send"))return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!BC.roles)bcLoadRoles();
  const roles=[{id:"owner",name:L("Owner")},{id:"admin",name:L("Admin")}].concat(BC.roles||[]).concat([{id:"",name:L("Keine Rolle")}]);
  const ck=(k,v,t)=>'<label class="ck"><input type="checkbox" data-bcsel="'+k+'" value="'+esc(v)+'"'+(BC.sel[k].includes(v)?' checked':'')+'> '+esc(t)+'</label>';
  return '<section class="mypage bcpage"><h2 class="pgt">'+L("Push-Nachricht senden")+'</h2><p class="ghint">'+L("Geht sofort als Push-Nachricht an alle, die Push-Nachrichten eingeschaltet haben.")+'</p>'+
    '<form class="bcform" data-bc novalidate><label>'+L("Titel")+'<input name="bt" maxlength="60" required placeholder="'+esc(L("z. B. Drehplan geändert"))+'"></label>'+
    '<label>'+L("Nachricht")+'<textarea name="bb" rows="4" maxlength="300" required placeholder="'+esc(L("Kurz und klar, max. 300 Zeichen"))+'"></textarea></label>'+
    '<fieldset class="efood"><legend>'+L("Empfänger")+'</legend><label class="ck"><input type="radio" name="bm" value="all"'+(BC.mode==="all"?' checked':'')+'> '+L("Alle")+'</label><label class="ck"><input type="radio" name="bm" value="sel"'+(BC.mode==="sel"?' checked':'')+'> '+L("Auswahl nach Rolle und/oder Abteilung")+'</label>'+
      (BC.mode==="sel"?'<p class="ahint"><b>'+L("Rollen")+'</b></p><div class="bcchk">'+roles.map(r=>ck("roles",r.id,r.name)).join("")+'</div><p class="ahint"><b>'+L("Abteilungen")+'</b></p><div class="bcchk">'+bcDepts().map(d=>ck("depts",d,HIT(d))).join("")+'</div><p class="ghint">'+L("Wer zu einer gewählten Rolle ODER Abteilung gehört, bekommt die Nachricht.")+'</p>':'')+'</fieldset>'+
    '<div class="arb"><button type="submit"'+(BC.busy?' disabled':'')+'>'+L("Jetzt senden")+'</button></div><p class="amsg'+(BC.ok?' ok':'')+'" role="status">'+esc(BC.msg)+'</p></form>'+
    '<h3 class="cath3">'+L("Verlauf")+'</h3>'+bcHistHTML()+'</section>';
};
document.addEventListener("change",e=>{const t=e.target;if(t.matches("[data-bc] input[name=bm]")){BC.mode=t.value;const f=t.form;const keep={bt:f.bt.value,bb:f.bb.value};render();const g=document.querySelector("[data-bc]");if(g){g.bt.value=keep.bt;g.bb.value=keep.bb}}
  else if(t.matches("[data-bcsel]")){const k=t.dataset.bcsel;BC.sel[k]=BC.sel[k].filter(x=>x!==t.value);if(t.checked)BC.sel[k].push(t.value)}});
document.addEventListener("submit",async e=>{const f=e.target.closest("form[data-bc]");if(!f)return;e.preventDefault();if(!can("push.send")||BC.busy)return;
  const title=String(f.bt.value||"").trim().slice(0,60),body=String(f.bb.value||"").trim().slice(0,300);const msg=f.querySelector(".amsg");
  if(!title||!body){msg.className="amsg";msg.textContent=L("Bitte Titel und Nachricht eingeben.");return}
  const sel=BC.mode==="sel";if(sel&&!BC.sel.roles.length&&!BC.sel.depts.length){msg.className="amsg";msg.textContent=L("Bitte mindestens eine Rolle oder Abteilung wählen.");return}
  const who=sel?[BC.sel.roles.map(r=>r==="owner"?L("Owner"):r==="admin"?L("Admin"):r===""?L("Keine Rolle"):((BC.roles||[]).find(x=>x.id===r)||{}).name||r).concat(BC.sel.depts).join(", ")]:[L("alle")];
  if(!confirmSafe(L("Push-Nachricht jetzt senden an:")+" "+who.join(", ")+"?"))return;
  BC.busy=true;f.querySelector("button[type=submit]").disabled=true;
  try{const pl={title,body,roles:sel?BC.sel.roles:null,depts:sel?BC.sel.depts:null,by:ME.email,at:Date.now()};
    const key=await getDataKey(),iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(pl))));
    const all=new Uint8Array(12+ct.length);all.set(iv);all.set(ct,12);let bin="";for(let i=0;i<all.length;i+=8192)bin+=String.fromCharCode.apply(null,all.subarray(i,i+8192));
    const {F,db,auth}=await fb();const ref=await F.addDoc(F.collection(db,"broadcasts"),{c:btoa(bin),at:F.serverTimestamp()});
    const r=await bcDeliver(ref.id);BC.ok=true;BC.msg=r;BC.sel={roles:[],depts:[]};BC.mode="all";f.reset();BC.hist=null}
  catch(err){console.error(err);BC.ok=false;BC.msg=/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err)}
  BC.busy=false;render()});
/* ---- welcome note (BETA, no warranty): shown once to every user until confirmed; the confirmation is kept in the profile ---- */
const WELCOME_VER="1";
const WTXT={
 de:{t:"Herzlich willkommen in der TSCHUGGER-App!",p:["Schön, dass du dabei bist. Hier findest du Drehplan, Callsheets, Crewliste, Locations und Drehbuch von TSCHUGGER Tigerblood an einem Ort.","Bitte beachte: Die App ist eine BETA-Testversion. Alle angezeigten Daten sind ohne Gewähr. Die Produktion und das Entwicklungsteam übernehmen KEINE Garantie für die Richtigkeit, Vollständigkeit oder Aktualität der Daten. Verbindlich sind immer die offiziellen Unterlagen der Produktion (Drehplan, Callsheet, Dispo).","Alle Inhalte sind vertraulich und nur für die Crew bestimmt – bitte nicht weitergeben.","Fehler entdeckt oder einen Wunsch? Melde dich bei Stefan Künzler."],c:"Ich habe die Hinweise gelesen und verstanden.",b:"Bestätigen"},
 fr:{t:"Bienvenue dans l'app TSCHUGGER !",p:["Ravi·e de t'accueillir. Tu trouves ici le plan de tournage, les callsheets, la liste de l'équipe, les décors et le scénario de TSCHUGGER Tigerblood au même endroit.","Attention : l'app est une version de test BETA. Toutes les données affichées sont sans garantie. La production et les développeurs n'assument AUCUNE garantie quant à l'exactitude, l'exhaustivité ou l'actualité des données. Seuls les documents officiels de la production (plan de tournage, callsheet, dispo) font foi.","Tous les contenus sont confidentiels et réservés à l'équipe – merci de ne pas les diffuser.","Une erreur ou une suggestion ? Contacte Stefan Künzler."],c:"J'ai lu et compris ces indications.",b:"Confirmer"},
 it:{t:"Benvenuta/o nell'app TSCHUGGER!",p:["Che bello averti a bordo. Qui trovi piano di lavorazione, callsheet, lista crew, location e sceneggiatura di TSCHUGGER Tigerblood in un unico posto.","Nota bene: l'app è una versione di prova BETA. Tutti i dati visualizzati sono senza garanzia. La produzione e gli sviluppatori NON si assumono alcuna garanzia sulla correttezza, completezza o attualità dei dati. Fanno fede sempre i documenti ufficiali della produzione (piano di lavorazione, callsheet, dispo).","Tutti i contenuti sono riservati e destinati solo alla crew – per favore non diffonderli.","Hai trovato un errore o hai un desiderio? Rivolgiti a Stefan Künzler."],c:"Ho letto e compreso le indicazioni.",b:"Conferma"},
 hi:{"t": "TSCHUGGER ऐप में आपका स्वागत है!", "p": ["आपके साथ होने की खुशी है। यहाँ TSCHUGGER Tigerblood का शेड्यूल, Callsheets, Crew सूची, लोकेशन और स्क्रिप्ट एक ही जगह मिलेंगे।", "कृपया ध्यान दें: यह ऐप BETA परीक्षण संस्करण है। दिखाया गया सारा डेटा बिना गारंटी के है। प्रोडक्शन और डेवलपर्स डेटा के सही, पूर्ण या अद्यतन होने की कोई गारंटी नहीं देते। प्रोडक्शन के आधिकारिक दस्तावेज़ (शेड्यूल, Callsheet, Dispo) ही मान्य हैं।", "सारी सामग्री गोपनीय है और केवल Crew के लिए है – कृपया आगे न भेजें।", "कोई गलती मिली या कोई सुझाव है? Stefan Künzler से संपर्क करें।"], "c": "मैंने ये निर्देश पढ़ और समझ लिए हैं।", "b": "पुष्टि करें"},
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
  if(await welcomeDone()){maybeTour();return}
  WELCOME_OPEN=true;let T=WTXT[LANG]||(LANG==="hi"?WTXT.en:WTXT.de);
  if(LANG==="de"||docRaw("welcome").custom||docRaw("disclaimer").custom){const w=docGet("welcome",{});const dis=docRaw("disclaimer").body.trim();
    T=Object.assign({},WTXT[LANG]||(LANG==="hi"?WTXT.en:WTXT.de),{t:w.subject,p:w.body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)});T.warnIdx=T.p.findIndex(x=>x===dis)}
  const d=document.createElement("div");d.id="welcome";d.className="a2hs";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");
  d.innerHTML='<div class="a2box wlbox"><span class="wlbeta">BETA</span><h3>'+esc(T.t)+'</h3>'+T.p.map((x,i)=>'<p'+(i===(T.warnIdx!==undefined?T.warnIdx:1)?' class="wlwarn"':'')+'>'+esc(x)+'</p>').join("")+
    '<label class="wlchk"><input type="checkbox" data-wlok> '+esc(T.c)+'</label><div class="a2b"><button type="button" class="pri" data-wlgo disabled>'+esc(T.b)+'</button></div><p class="amsg" role="alert"></p></div>';
  d.addEventListener("change",e=>{if(e.target.matches("[data-wlok]"))d.querySelector("[data-wlgo]").disabled=!e.target.checked});
  d.addEventListener("click",async e=>{const b=e.target.closest("[data-wlgo]");if(!b||b.disabled)return;b.disabled=true;
    const at=new Date().toISOString();store("welcomeAck",at+"|"+WELCOME_VER);savePrefs();
    try{if(MEMBER){const {F,db}=await fb();await F.updateDoc(F.doc(db,"members",ME.uid),{welcomeAck:at,welcomeVer:WELCOME_VER});MEMBER.welcomeAck=at;MEMBER.welcomeVer=WELCOME_VER}}catch(err){console.warn("welcome",err&&err.code||err)}
    d.remove();WELCOME_OPEN=false;maybeTour()});
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
function seenText(m){const t=seenMs(m);if(!t)return m&&m.active===true?L("noch nie online"):"";const d=Date.now()-t;if(d<4*60e3)return L("gerade aktiv");
  const mi=Math.round(d/60e3);if(mi<60)return L("zuletzt online")+" "+L("vor {n} Min.").replace("{n}",mi);
  const dt=new Date(t),hm=dt.toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"}),day=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(),dd=Math.round((day(new Date())-day(dt))/864e5);
  return L("zuletzt online")+" "+(dd===0?L("heute")+" "+hm:dd===1?L("gestern")+" "+hm:dt.toLocaleDateString("de-CH")+" "+hm)}
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
  hideGate();acctButton(true);PUBB.loaded=false;PUBB.list=[];loadPrefs();startSeen();pushSyncSoon();
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
/* function (job): from the crew list when listed there, otherwise the person enters it in the profile (members.func) */
function funcField(){const cp=(typeof crewPerson==="function"&&ME&&crewPerson(lc(ME.email)))||{};
  if(cp.role)return '<div class="pname pfunc"><span>'+L("Funktion")+'</span><b>'+esc(cp.role)+'</b></div>';
  return '<label>'+L("Funktion")+'<input type="text" name="fu" maxlength="80" autocomplete="organization-title" placeholder="'+esc(L("z. B. Kamera-Assistenz"))+'" value="'+esc((MEMBER&&MEMBER.func)||"")+'"></label>'}
function nameFields(){
  const cn=crewNames();
  if(cn)return '<div class="pname"><span>'+L("Vorname")+'</span><b>'+esc(cn.firstName)+'</b><span>'+L("Nachname")+'</span><b>'+esc(cn.lastName||"–")+'</b></div><p class="ghint">'+L("Aus der Crewliste übernommen.")+'</p>';
  return '<label>'+L("Vorname")+'<input type="text" name="fn" autocomplete="given-name" required value="'+esc((MEMBER&&MEMBER.firstName)||"")+'"></label><label>'+L("Nachname")+'<input type="text" name="ln" autocomplete="family-name" required value="'+esc((MEMBER&&MEMBER.lastName)||"")+'"></label>';
}
const GENDERS=[["m","Männlich"],["w","Weiblich"],["d","Divers"]];
const genderSel=(n,v,req)=>'<select name="'+n+'"'+(req?' required':'')+'><option value="">–</option>'+GENDERS.map(([k,t])=>'<option value="'+k+'"'+(v===k?' selected':'')+'>'+L(t)+'</option>').join("")+'</select>';
function profileForm(onb){
  return '<form data-af="pf" novalidate>'+nameFields()+funcField()+contactFields(MEMBER)+'<label>'+L("Sprache der App")+langSel("lg",(MEMBER&&MEMBER.lang)||LANG)+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" autocomplete="bday" value="'+esc((MEMBER&&MEMBER.birthday)||"")+'"></label><label>'+L("Geschlecht")+genderSel("gd",(MEMBER&&MEMBER.gender)||"",true)+'</label><fieldset class="efood"><legend>'+L("Essen")+'</legend><label>'+L("Ernährung")+dietSel("dt",(MEMBER&&MEMBER.diet)?normDiet(MEMBER).diet:"",true)+'</label><label class="full">'+L("Verträglichkeiten")+'</label>'+intolBoxes("pint",normDiet(MEMBER).intol)+'<label class="full">'+L("Weitere Allergien (optional)")+'<input type="text" name="al" maxlength="200" value="'+esc((MEMBER&&MEMBER.allergies)||"")+'"></label><p class="ghint">'+L("Nur für die Produktion sichtbar.")+'</p></fieldset><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p></form>';
}
function acctInner(){
  return '<div class="myhead"><h2 class="pgt">'+L("Mein Konto")+'</h2><button type="button" class="pillbtn" data-ac="signout">'+L("Abmelden")+'</button></div><p class="acwho">'+L("Angemeldet als")+' <b>'+esc(ME.email)+'</b>'+' · '+L("Rolle")+': <b>'+esc(isOwner()?L("Owner"):isAdmin()?L("Admin"):MYROLE?(MYROLE==="crew"?"Crew":MYROLE):L("keine"))+'</b>'+(()=>{let w=(MEMBER&&MEMBER.welcomeAck)||"";if(!w)try{w=(localStorage.getItem("welcomeAck")||"").split("|")[0]}catch(_){}return w?' · '+L("Willkommen bestätigt")+' '+esc(new Date(w).toLocaleDateString("de-CH")):''})()+'</p>'+
    (MEMBER||isAdmin()?'<section class="psec"><h4>'+L("Profil")+'</h4>'+profileForm(false)+'</section>':'')+
    (ME?pushSec():'')+(window.TOUREN?'<section class="psec"><h4>'+L("Einführungstour")+'</h4><p class="ghint">'+esc(tourInfo(MEMBER)||L("Tour offen"))+(MEMBER&&MEMBER.tourAt?' · '+esc(new Date(MEMBER.tourAt).toLocaleDateString("de-CH")):'')+'</p><button type="button" class="pillbtn" data-ac="tour">'+L("Tour starten")+'</button></section>':'')+(typeof chatSec==="function"?chatSec():'')+'<section class="psec"><h4>'+L("Darstellung")+'</h4><div class="thm" role="group" aria-label="'+L("Darstellung")+'"><button type="button" data-ac="theme" data-thset="dark" aria-pressed="'+(getTheme()==="dark")+'">☾ '+L("Dunkel")+'</button><button type="button" data-ac="theme" data-thset="light" aria-pressed="'+(getTheme()==="light")+'">☀ '+L("Hell (gut lesbar)")+'</button></div></section>'+
    (isPwUser()?'':'<p class="ghint">'+L("Du bist mit Google angemeldet. Passwort und Adresse verwaltest du in deinem Google-Konto.")+'</p>')+(!isPwUser()?'':'<details><summary>'+L("Passwort ändern")+'</summary><form data-af="pw"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neues Passwort")+'<input type="password" name="pw" autocomplete="new-password" minlength="8" required></label><label>'+L("Passwort wiederholen")+'<input type="password" name="pw2" autocomplete="new-password" minlength="8" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p><button type="button" class="glink" data-ac="pwreset">'+L("Passwort vergessen?")+'</button></form></details>'+
    '<details><summary>'+L("E-Mail-Adresse ändern")+'</summary><form data-af="em"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neue E-Mail-Adresse")+'<input type="email" name="em" autocomplete="email" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p></form></details>')+
    '';
}
/* «Mein Konto» is its own page; only the first-start profile (onboarding) stays a dialog */
VIEWS.acct=function(){if(ME)setTimeout(()=>{const v=document.getElementById("view");if(v&&S.tab==="acct")markNeed(v)},0);return ME?'<section class="mypage acpage">'+acctInner()+'</section>':'<div class="empty">'+L("Kein Zugang")+'</div>'};
let ACCTWIRED=false;setTimeout(()=>wireAcctPage(),0);
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
  else if(b.dataset.ac==="tour")tourStart(false);
  else if(b.dataset.ac==="pwreset"){const msg=b.closest("form").querySelector(".amsg");msg.className="amsg";msg.textContent="";b.disabled=true;
    try{const {A,auth}=await fb();await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),auth.currentUser.email);msg.classList.add("ok");msg.textContent=L("Link zum Zurücksetzen gesendet an")+" "+auth.currentUser.email+". "+L("Schau auch im Spam-Ordner nach.")}
    catch(err){console.error(err);msg.textContent=errText(err)}b.disabled=false}
  else if(b.dataset.ac==="admin"){s.hidden=true;S.tab="admin";window.scrollTo(0,0);render()}
  else if(b.dataset.ac==="signout"){b.disabled=true;s.hidden=true;S.tab="plan";store("tab","plan");
    try{const {A,auth}=await fb();await A.signOut(auth)}catch(err){console.error(err)}
    /* straight to the sign-in screen (e-mail + password) */
    ME=null;MYPERMS=[];{const w=document.getElementById("welcome");if(w)w.remove();WELCOME_OPEN=false;if(TOUR.el){TOUR.el.remove();TOUR.el=null}}acctButton(false);clearLocal();if(window.resetViewState)window.resetViewState();render();showGate("login")}
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
      const upd={firstName:cn?cn.firstName:clean(f.fn.value),lastName:cn?cn.lastName:clean(f.ln.value),lang:f.lg.value,birthday:f.bd.value||"",gender:f.gd?f.gd.value:"",phone:String(f.ph.value||"").trim().slice(0,40),contactEmail:lc(String(f.ce.value||"").trim()).slice(0,120),diet:f.dt.value,intol:readBoxes(f,"pint"),allergies:String(f.al.value||"").trim().slice(0,200)};if(f.fu)upd.func=String(f.fu.value||"").trim().slice(0,80);
      upd.name=[upd.firstName,upd.lastName].filter(Boolean).join(" ");
      const ref=F.doc(db,"members",u.uid);
      const wr=()=>MEMBER?F.updateDoc(ref,upd):F.setDoc(ref,Object.assign({active:true,email:lc(u.email),joinedAt:F.serverTimestamp()},upd));
      try{await wr()}catch(err){if(!/permission/.test(err&&err.code||""))throw err;await u.reload().catch(()=>{});await u.getIdToken(true);
        try{await wr()}catch(e2){if(!/permission/.test(e2&&e2.code||"")||!("gender" in upd))throw e2;delete upd.gender;delete upd.phone;delete upd.contactEmail;delete upd.func;await wr();PARTIAL=true}} /* until the Firestore rules allow «gender», save the rest */
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
  try{const ow=await F.getDocs(F.collection(db,"owners"));ADM.own=ow.docs.map(d=>d.id);for(const e of ADM.own)if(!ADMINS.includes(e))ADMINS.push(e);for(let k=ADMINS.length-1;k>=0;k--)if(!ROOT_OWNERS.includes(ADMINS[k])&&!ADM.own.includes(ADMINS[k])&&!(ME&&lc(ME.email)===ADMINS[k]))ADMINS.splice(k,1)}catch(_){ADM.own=ADM.own||[]}
  ADM.roles=ro.docs.filter(d=>d.id!=="admin").map(d=>Object.assign({id:d.id},d.data()));
  if(isOwner()&&!ADM.roles.some(x=>x.id==="crew")){const cp=VIEWPERMS.filter(p=>p!=="view.mycal");try{await F.setDoc(F.doc(db,"roles","crew"),{name:"Crew",perms:cp,at:F.serverTimestamp()});ADM.roles.push({id:"crew",name:"Crew",perms:cp})}catch(err){console.warn("crew role",err&&err.code||err)}}{const ad=ro.docs.find(d=>d.id==="admin");ADM.adminPerms=ad?(ad.data().perms||[]):ADMIN_DEFAULT.slice()}ADM.ur={};ur.docs.forEach(d=>{ADM.ur[d.id]=String((d.data()||{}).role||"")});
  if(can("users.requests")){try{const r=await F.getDocs(F.collection(db,"requests"));ADM.req=r.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.reqErr=""}catch(err){ADM.req=[];ADM.reqErr=(err&&err.code)||String(err)}}else{ADM.req=[];ADM.reqErr=""}
  {const b=document.getElementById("admBtn");if(b){b.classList.toggle("hasreq",ADM.req.length>0);b.dataset.n=ADM.req.length||""}}
  ADM.adm=a.docs.map(d=>d.id);ADM.inv=i.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.mem=m.docs.map(d=>Object.assign({uid:d.id},d.data()));ADM.at=Date.now();admIndex();ADM.loaded=true;render();syncBdays();
}
function crewEmails(){const out=[],seen=new Set();for(const g of S.crew)for(const p of (g.people||[])){const e=lc(p.email);if(!e||!/@/.test(e)||seen.has(e))continue;seen.add(e);out.push({email:e,name:p.name||"",role:p.role||""})}return out}
/* collapsible admin sections in the crew tab; open by default, state remembered per section */
const SECS={};try{for(const k of ["cater","bcal","set-up","set-langs","set-areas","set-misc","set-src","set-bk"])SECS[k]=localStorage.getItem("sec:"+k)!=="0";SECS.appset=localStorage.getItem("sec:appset")==="1";SECS.catmore=localStorage.getItem("sec:catmore")==="1";SECS.upsec=localStorage.getItem("sec:upsec")==="1"}catch(_){SECS.cater=SECS.bcal=true}
const secOpen=(k,title,body)=>'<details class="asec '+k+'" data-sec="'+k+'"'+(SECS[k]!==false?' open':'')+'><summary>'+esc(title)+'</summary><div class="asb">'+body+'</div></details>';
document.addEventListener("toggle",e=>{const d=e.target;if(!d||!d.dataset||!d.dataset.sec)return;SECS[d.dataset.sec]=d.open;try{localStorage.setItem("sec:"+d.dataset.sec,d.open?"1":"0")}catch(_){}},true);
/* departments that are not fed on set: left out of the catering count */
const NO_CATER=/^(catering|postprod|verleih)/i;
function crewDeptOf(m){
  const e=lc(m.email),k=nkey([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name);
  const x=aix();return (e&&x.dept.get("e:"+e))||(k&&x.dept.get("n:"+k))||"";
}
/* catering: the crew list shows a short summary at the top and bundles the details in one collapsible block;
   the Catering page (tab instead of Script for people with the catering permission) shows everything at a glance */
function caterData(){
  const act=ADM.mem.filter(m=>m.active===true&&!NO_CATER.test(crewDeptOf(m))).map(normDiet);
  const nm=m=>[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||(crewPerson(m.email)||{}).name||m.email;
  const alg=m=>String(m.allergies||"").trim();
  const special=act.filter(m=>(m.diet&&m.diet!=="none")||m.intol.length||alg(m));
  const groups=DIETS.filter(d=>d[0]!=="none").map(d=>[L(d[1]),special.filter(m=>m.diet===d[0])]).concat(INTOL.map(i=>[L(i[1]),special.filter(m=>m.intol.includes(i[0]))])).filter(g=>g[1].length);
  const allergy=special.filter(alg);
  return {act,special,groups,allergy,nm,alg};
}
function caterSummary(c){
  return '<p class="catsum"><b>'+c.act.length+'</b> '+esc(L("Personen"))+' · <b>'+(c.act.length-c.special.length)+'</b> '+esc(L("ohne Sonderwünsche"))+' · <b>'+c.special.length+'</b> '+esc(L("mit Sonderwünschen"))+'</p>'+
    (c.groups.length||c.allergy.length?'<div class="catchips">'+c.groups.map(([t,l])=>'<span class="catchip"><b>'+l.length+'</b> '+esc(t)+'</span>').join("")+(c.allergy.length?'<span class="catchip warn"><b>'+c.allergy.length+'</b> '+esc(L("Weitere Allergien"))+'</span>':'')+'</div>':'');
}
function caterOverview(c){
  const dep=m=>crewDeptOf(m)||"–";
  let h='<div class="catgrid">'+c.groups.map(([t,l])=>'<div class="catcard"><h4><b>'+l.length+'</b> '+esc(t)+'</h4><div class="catn">'+l.map(m=>esc(c.nm(m))).sort((a,b)=>a.localeCompare(b,LANG)).join("<br>")+'</div></div>').join("")+
    (c.allergy.length?'<div class="catcard warn"><h4><b>'+c.allergy.length+'</b> '+esc(L("Weitere Allergien"))+'</h4><div class="catn">'+c.allergy.map(m=>'<b>'+esc(c.nm(m))+'</b>: '+esc(c.alg(m))).join("<br>")+'</div></div>':'')+'</div>';
  if(c.special.length)h+='<h3 class="cath3">'+esc(L("Alle Sonderwünsche"))+'</h3><div class="cattbl">'+c.special.slice().sort((a,b)=>c.nm(a).localeCompare(c.nm(b),LANG)).map(m=>'<div class="catrow"><div><b>'+esc(c.nm(m))+'</b><span class="catdep">'+esc(HIT(dep(m)))+'</span></div><div>'+esc(dietText(m))+'</div></div>').join("")+'</div>';
  return h;
}
function cateringHTML(){
  const c=caterData();if(!c.act.length)return"";
  const chips=c.groups.map(([t,l])=>'<span class="catchip"><b>'+l.length+'</b> '+esc(t)+'</span>').join("")+(c.allergy.length?'<span class="catchip warn"><b>'+c.allergy.length+'</b> '+esc(L("Weitere Allergien"))+'</span>':'');
  return '<details class="catbox" data-sec="catmore"'+(SECS.catmore===true?' open':'')+'><summary><div class="cathd"><span class="catic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 3c-1.7 0-3 2-3 5s1.3 4 3 4v9"/></svg></span><div class="catt"><b>Catering</b><span>'+c.act.length+' '+esc(L("Personen"))+' · '+c.special.length+' '+esc(L("mit Sonderwünschen"))+'</span></div><span class="catchev" aria-hidden="true"></span></div>'+
    (chips?'<div class="catchips">'+chips+'</div>':'')+'</summary><div class="catbody">'+(c.special.length?caterOverview(c):'<p class="ghint">'+esc(L("Keine Sonderwünsche."))+'</p>')+'</div></details>';
}
document.addEventListener("click",e=>{if(e.target.closest("[data-catpage]")){S.tab="cater";S.srcOpen=false;window.scrollTo(0,0);render()}});
VIEWS.cater=function(){
  if(!ME||!can("crew.food"))return '<div class="empty">'+L("Kein Zugang")+'</div>';
  ensureAdm();if(!ADM.loaded)return '<section class="mypage catpage"><h2 class="pgt">Catering</h2><p class="ghint">'+(ADM.err?esc(L("Daten der Benutzer:innen nicht lesbar"))+' ('+esc(ADM.err)+')':L("Lade …"))+'</p></section>';
  const c=caterData();
  return '<section class="mypage catpage"><h2 class="pgt">Catering</h2><p class="ghint">'+esc(L("Alle aktiven Benutzer:innen der App, die am Set verpflegt werden."))+'</p>'+caterSummary(c)+caterOverview(c)+'</section>';
};
window.caterTab=()=>!!(ME&&can("crew.food"));
/* ---- backup (main admin only): users, invites, admins, settings, birthdays as one JSON file ---- */
const BK={busy:false,msg:"",ok:false};
function bkSec(){
  let last="";try{last=localStorage.getItem("bk:last")||""}catch(_){}
  return '<div class="bk">'+
    '<p class="ahint">'+L("Sichert Benutzer:innen, Einladungen, Administrator:innen, Einstellungen der App und Geburtstage als Datei. Die Drehdaten selbst kommen aus der Dropbox und brauchen kein Backup.")+'</p>'+
    (last?'<p class="ahint">'+L("Letztes Backup auf diesem Gerät")+': '+esc(fmtStamp(last))+'</p>':'')+
    '<div class="bkb"><button type="button" class="abtn" data-bk="dl"'+(BK.busy?' disabled':'')+'>'+L("Backup herunterladen")+'</button>'+
    '<label class="abtn bkup">'+L("Backup wiederherstellen")+'<input type="file" accept="application/json,.json" data-bk="up" hidden></label></div>'+
    '<p class="ahint">'+L("Beim Wiederherstellen werden die Einträge aus der Datei ergänzt oder überschrieben. Nichts wird gelöscht.")+'</p>'+
    (BK.msg?'<p class="amsg'+(BK.ok?' ok':'')+'" role="status">'+esc(BK.msg)+'</p>':'')+'</div>';
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
  return '<div class="upsec"><p class="ahint"><b>'+L("Automatische Aktualisierung (Dropbox → Webseite)")+'</b></p>'+st+
    '<p class="ahint">'+L("GitHub liest die Dropbox zweimal pro Stunde (nur lesend), wandelt neue Drehpläne, Crewlisten, Dispos und das Drehbuch um und veröffentlicht sie verschlüsselt auf der Webseite – ohne dass ein Computer laufen muss.")+'</p>'+
    (ok?'':'<ol class="upsteps"><li>'+L("Dropbox-Zugang (nur lesend) erzeugen:")+' <a href="dropbox-setup.html" target="_blank" rel="noopener">dropbox-setup.html</a> → <code>DROPBOX_APP_KEY</code>, <code>DROPBOX_REFRESH_TOKEN</code></li>'+
      '<li>'+L("Claude-API-Schlüssel erstellen:")+' <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a> → <code>ANTHROPIC_API_KEY</code></li>'+
      '<li><code>CREW_KEY</code> – '+L("den Schlüssel der Crew-Daten bekommst du von Claude im Chat.")+'</li>'+
      '<li>'+L("Alle vier in GitHub eintragen:")+' <a href="'+GH+'/settings/secrets/actions" target="_blank" rel="noopener">Settings → Secrets → Actions</a></li>'+
      '<li>'+L("Ersten Lauf starten:")+' <a href="'+GH+'/actions/workflows/dropbox-update.yml" target="_blank" rel="noopener">Actions → «Run workflow»</a></li></ol>')+
    '<p class="ahint"><a href="'+GH+'/actions/workflows/dropbox-update.yml" target="_blank" rel="noopener">'+L("Läufe auf GitHub ansehen")+'</a></p></div>';
}
/* owner only: account with a one-time start password, created in a second Firebase instance so the owner stays signed in */
function genPw(){const c="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789",r=new Uint32Array(12);crypto.getRandomValues(r);
  const x=[...r].map(v=>c[v%c.length]).join("");return x.slice(0,4)+"-"+x.slice(4,8)+"-"+x.slice(8)}
async function createStartAccount(em,nm){
  em=lc(em);const {AP,A,F,db}=await fb();const pw=genPw();
  await F.setDoc(F.doc(db,"starts",em),{mustChange:true,at:F.serverTimestamp()});
  if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:String(nm||"").slice(0,80),role:"",addedAt:F.serverTimestamp()});await assignCrew(em);
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
  const tel=x=>'<a href="tel:'+esc(String(x).replace(/[^\d+]/g,""))+'">☎ '+esc(x)+'</a>',mail=x=>'<a href="mailto:'+esc(x)+'">✉ '+esc(x)+'</a>';
  const bits=[esc(wl),m.phone?tel(m.phone):"",m.contactEmail&&m.contactEmail!==m.email?mail(m.contactEmail):"",m.birthday?esc(L("Geburtsdatum")+": "+m.birthday.split("-").reverse().join(".")):"",g?esc(L(g)):"",esc(dietText(m))].filter(Boolean);
  return bits.length?'<div class="uinf">'+bits.join(" · ")+'</div>':"";
}
/* new users get the role «Crew» automatically (an invitation creates userroles/{email} = crew) */
async function assignCrew(em){em=lc(em);if(!em||ADMINS.includes(em)||(ADM.adm||[]).includes(em)||(ADM.ur||{})[em])return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"userroles",em),{role:"crew",at:F.serverTimestamp()});ADM.ur=ADM.ur||{};ADM.ur[em]="crew"}catch(err){console.warn("crew role",err&&err.code||err)}}
/* once (owner): everyone already in the app without a role gets «Crew», so nobody loses access */
async function migrateCrew(){
  if(!isOwner())return;try{if(localStorage.getItem("crewMigrated")==="1")return}catch(_){}
  try{const {F,db}=await fb();const cfg=await F.getDoc(F.doc(db,"config","app"));if(cfg.exists()&&cfg.data().crewMigrated){try{localStorage.setItem("crewMigrated","1")}catch(_){}return}
    const [m,i,a,u]=await Promise.all([F.getDocs(F.collection(db,"members")),F.getDocs(F.collection(db,"invites")),F.getDocs(F.collection(db,"admins")),F.getDocs(F.collection(db,"userroles"))]);
    const has=new Set(u.docs.map(d=>d.id)),adm=new Set(a.docs.map(d=>d.id));
    const ems=[...new Set(m.docs.map(d=>lc(d.data().email||"")).concat(i.docs.map(d=>d.id)))].filter(e=>e&&!has.has(e)&&!adm.has(e)&&!ADMINS.includes(e));
    for(let k=0;k<ems.length;k+=400){const b=F.writeBatch(db);ems.slice(k,k+400).forEach(e=>b.set(F.doc(db,"userroles",e),{role:"crew",at:F.serverTimestamp()}));await b.commit()}
    await F.setDoc(F.doc(db,"config","app"),{crewMigrated:true},{merge:true});try{localStorage.setItem("crewMigrated","1")}catch(_){}
    if(ems.length)console.info("crew role assigned to",ems.length);ADM.loaded=false}
  catch(err){console.warn("crew migration",err&&err.code||err)}
}
/* role picker (owner): Benutzer:in, Admin or one of the custom roles */
const canRole=e=>!!e&&!ROOT_OWNERS.includes(e)&&!(ME&&lc(ME.email)===e)&&(isOwner()||(isAdmin()&&!ADMINS.includes(e)));
const roleOf=e=>{if(ADMINS.includes(e))return "owner";if(ADM.adm.includes(e))return "admin";const id=ADM.ur[e];return id&&ADM.roles.some(x=>x.id===id)?id:""};
const roleName=id=>id==="admin"?L("Admin"):((ADM.roles.find(x=>x.id===id)||{}).name||"");
const roleSel=r=>'<label class="rolesel">'+L("Rolle")+' <select data-urole="'+esc(r.email)+'"><option value="">'+L("Keine Rolle (eingeschränkt)")+'</option>'+(isOwner()?'<option value="owner"'+(roleOf(r.email)==="owner"?' selected':'')+'>'+L("Owner")+'</option>':'')+'<option value="admin"'+(roleOf(r.email)==="admin"?' selected':'')+'>'+L("Admin")+'</option>'+ADM.roles.slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),LANG)).map(x=>'<option value="'+esc(x.id)+'"'+(roleOf(r.email)===x.id?' selected':'')+'>'+esc(x.name||x.id)+'</option>').join("")+'</select></label>';
function editForm(r,withRole){
  const m=r.m,i=ADM.inv.find(x=>x.id===r.email)||{},v=x=>esc(x||"");
  return (withRole&&canRole(r.email)?'<div class="aerole">'+roleSel(r)+'</div>':'')+'<form class="aedit" data-adm="save" data-em="'+esc(r.email)+'">'+
    (m?'<label>'+L("Vorname")+'<input name="fn" maxlength="60" value="'+v(m.firstName)+'"></label><label>'+L("Nachname")+'<input name="ln" maxlength="60" value="'+v(m.lastName)+'"></label>'+
       '<label>'+L("Funktion")+'<input name="rl" maxlength="80" value="'+v(i.role||r.role||(m&&m.func))+'"></label>'+
       '<label>'+L("Sprache der App")+langSel("lg",m.lang||"de")+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" value="'+v(m.birthday)+'"></label><label>'+L("Geschlecht (optional)")+genderSel("gd",m.gender||"")+'</label>'+contactFields(m,"e")+
       '<fieldset class="efood"><legend>'+L("Essen")+'</legend><label>'+L("Ernährung")+dietSel("edt",normDiet(m).diet)+'</label><label>'+L("Verträglichkeiten")+'</label>'+intolBoxes("eint",normDiet(m).intol)+'<label>'+L("Weitere Allergien (optional)")+'<input name="eal" maxlength="200" value="'+v(m.allergies)+'"></label></fieldset>'
     :'<label>'+L("Name")+'<input name="nm" maxlength="80" value="'+v(i.name||r.name)+'"></label><label>'+L("Funktion")+'<input name="rl" maxlength="80" value="'+v(i.role||r.role)+'"></label>')+
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
  const cnt=id=>id==="admin"?ADM.adm.length:Object.keys(ADM.ur||{}).filter(e=>ADM.ur[e]===id&&!ADM.adm.includes(e)).length;
  const roles=(ADM.roles||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),LANG));
  const pplLbl=id=>cnt(id)+' '+L(cnt(id)===1?"Person":"Personen");
  const row=(id,name,perms,fixedName)=>{const open=ADM.redit===id;
    return '<div class="arole'+(open?' open':'')+'"><div class="arh"><div class="arn"><b>'+esc(name)+(id==="crew"?' <span class="ust role">'+L("Standard")+'</span>':'')+'</b><small>'+(id==="crew"?L("Wird neuen Benutzer:innen automatisch zugewiesen.")+' ':'')+(perms.length?perms.length+' '+L(perms.length===1?"Berechtigung":"Berechtigungen"):L("Keine Berechtigungen"))+' · '+pplLbl(id)+'</small></div><button type="button" class="pillbtn" data-redit="'+esc(id)+'">'+L(open?"Schliessen":"Bearbeiten")+'</button></div>'+
      (open?'<form class="arolef" data-role="'+esc(id)+'">'+(fixedName?'<input type="hidden" name="rn" value="'+esc(name)+'">':'<label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required value="'+esc(name)+'"></label>')+permBoxes(perms)+
        '<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Speichern")+'</button>'+(id==="crew"?'':id==="admin"?'<button type="button" class="lnk" data-rreset>'+L("Standard wiederherstellen")+'</button>':'<button type="button" class="lnk" data-rdel="'+esc(id)+'">'+L("Rolle löschen")+'</button>')+'</div></form>':'')+'</div>'};
  return '<div class="admins"><h3>'+L("Rollen")+'</h3><p class="ahint">'+L("Eine Rolle bündelt Berechtigungen. Zuweisen kannst du sie in der Benutzerverwaltung bei der Person unter «Rolle». Ohne Rolle sieht eine Person alle Drehdaten, die Crewliste, das Drehbuch und das Blocking, aber keine Verwaltung. Mit Rolle sieht sie nur die Bereiche, die die Rolle erlaubt.")+'</p>'+
    '<div class="arole fixed"><div class="arh"><div class="arn"><b>'+L("Owner")+'</b><small>'+L("Alles, auch Rollen, Admins, Sperren und Backup")+'</small></div></div></div>'+
    row("admin",L("Admin"),ADM.adminPerms||ADMIN_DEFAULT,true)+
    roles.map(ro=>row(ro.id,ro.name||ro.id,arr(ro.perms),false)).join("")+
    (ADM.redit==="new"?'<form class="arolef new" data-role=""><h4>'+L("Neue Rolle")+'</h4><label class="arl">'+L("Name der Rolle")+'<input name="rn" maxlength="40" required placeholder="'+esc(L("Name der Rolle, z. B. Catering"))+'"></label>'+permBoxes(VIEWPERMS)+'<p class="amsg" role="alert"></p><div class="arb"><button type="submit">'+L("Rolle erstellen")+'</button><button type="button" class="lnk" data-redit="new">'+L("Abbrechen")+'</button></div></form>':
      '<button type="button" class="abtn" data-redit="new">+ '+L("Neue Rolle")+'</button>')+'</div>'+permAccessSec();
}
/* who has which permission: every option can be opened and lists the people (owners, admins, roles; people without a role where allowed) */
function permAccessSec(){
  const nameOf=e=>{const m=ADM.mem.find(x=>x.email===e),i=ADM.inv.find(x=>x.id===e),cp=(typeof crewPerson==="function"&&crewPerson(e))||{};return (m&&([m.firstName,m.lastName].filter(Boolean).join(" ")||m.name))||(i&&i.name)||cp.name||e};
  const everyone=[...new Set(ADM.mem.map(m=>m.email).concat(ADM.inv.map(i=>i.id)).concat(ADMINS))].filter(Boolean);
  const rp=id=>{const r=(ADM.roles||[]).find(x=>x.id===id);return r?arr(r.perms):[]};const aperm=ADM.adminPerms||ADMIN_DEFAULT;
  const noRoleOK=k=>({"view.phone":"phone","view.email":"email","view.mycal":"mycal"})[k];
  const who=k=>everyone.map(e=>{if(ADMINS.includes(e))return [e,L("Owner")];if(ADM.adm.includes(e))return aperm.includes(k)?[e,L("Admin")]:null;const id=ADM.ur[e];
      if(id)return rp(id).includes(k)?[e,((ADM.roles||[]).find(x=>x.id===id)||{}).name||id]:null;const pk=noRoleOK(k);return pk&&window.PUBV&&window.PUBV[pk]?[e,L("Keine Rolle")]:null}).filter(Boolean)
    .sort((a,b)=>nameOf(a[0]).localeCompare(nameOf(b[0]),LANG));
  return '<div class="admins pacc"><h3>'+L("Wer hat welchen Zugriff?")+'</h3><p class="ahint">'+L("Tippe auf eine Berechtigung, um zu sehen, wer sie hat – und über welche Rolle.")+'</p>'+
    [...new Set(PERMS.map(x=>x[2]))].map(g=>'<h5 class="paccg">'+esc(L(g))+'</h5>'+PERMS.filter(x=>x[2]===g).map(([k,t])=>{const w=who(k);
      return '<details class="paccd" data-sec="pacc-'+k+'"'+(SECS["pacc-"+k]?' open':'')+'><summary><span>'+esc(L(t))+'</span><b class="pacn">'+w.length+'</b></summary>'+
        (w.length?'<ul class="paccl">'+w.map(([e,r])=>'<li><span>'+esc(nameOf(e))+'</span><span class="ust role">'+esc(r)+'</span></li>').join("")+'</ul>':'<p class="ghint">'+L("Niemand")+'</p>')+'</details>'}).join("")).join("")+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-redit]");if(b&&isAdmin()){ADM.redit=ADM.redit===b.dataset.redit?"":b.dataset.redit;render();return}
  if(e.target.closest("[data-rreset]")&&isAdmin()){const f=e.target.closest("form");f.querySelectorAll('input[name=rp]').forEach(x=>{x.checked=ADMIN_DEFAULT.includes(x.value)})}});
document.addEventListener("submit",async e=>{const f=e.target.closest("form.arolef");if(!f)return;e.preventDefault();if(!isAdmin())return;
  const name=String(f.rn.value||"").trim().slice(0,40),perms=readBoxes(f,"rp").filter(p=>PERMS.some(x=>x[0]===p));if(!name)return;
  let id=f.dataset.role;if(!id){id=fold(name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"rolle";if((ADM.roles||[]).some(x=>x.id===id))id+="-"+Date.now().toString(36).slice(-4)}
  const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"roles",id),{name,perms,at:F.serverTimestamp()});ADM.redit="";showMsg(L("Rolle gespeichert."),2500);document.activeElement&&document.activeElement.blur&&document.activeElement.blur();await admLoad()}
  catch(err){if(btn)btn.disabled=false;console.error(err);{const m=f.querySelector(".amsg");if(m){m.className="amsg";m.textContent=/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err)}}showMsg(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err),9000)}});
document.addEventListener("click",async e=>{const b=e.target.closest("[data-rdel]");if(!b||!isAdmin())return;const id=b.dataset.rdel,ro=(ADM.roles||[]).find(x=>x.id===id)||{};
  if(!confirmSafe(L("Rolle «{r}» löschen? Personen mit dieser Rolle verlieren ihre Berechtigungen.").replace("{r}",ro.name||id)))return;
  try{const {F,db}=await fb();for(const em of Object.keys(ADM.ur||{}))if(ADM.ur[em]===id)await F.deleteDoc(F.doc(db,"userroles",em));await F.deleteDoc(F.doc(db,"roles",id));showMsg(L("Rolle gelöscht."),2500);await admLoad()}
  catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}});
document.addEventListener("change",async e=>{const sl=e.target.closest("select[data-urole]");if(!sl||!isAdmin())return;e.stopPropagation();const em=sl.dataset.urole,v=sl.value;if(!canRole(em)||(v==="owner"&&!isOwner())){render();return}
  /* applied right away in the list (no full reload); written in the background, undone on error. Owners are managed by owners only */
  const prev={ur:ADM.ur[em],adm:ADM.adm.includes(em),own:ADMINS.includes(em)};
  const setLocal=(own,adm,ur)=>{const k=ADMINS.indexOf(em);if(own&&k<0)ADMINS.push(em);if(!own&&k>=0)ADMINS.splice(k,1);ADM.own=(ADM.own||[]).filter(x=>x!==em);if(own)ADM.own.push(em);ADM.adm=ADM.adm.filter(x=>x!==em);if(adm)ADM.adm.push(em);if(ur)ADM.ur[em]=ur;else delete ADM.ur[em]};
  setLocal(v==="owner",v==="admin",v&&v!=="owner"&&v!=="admin"?v:"");
  try{sl.blur()}catch(_){}admIndex&&admIndex();render();
  try{const {F,db}=await fb();
    if(v==="owner")await F.setDoc(F.doc(db,"owners",em),{addedAt:F.serverTimestamp()});
    else if(prev.own)await F.deleteDoc(F.doc(db,"owners",em));
    if(v==="admin"){if(!prev.adm)await F.setDoc(F.doc(db,"admins",em),{addedAt:F.serverTimestamp()})}else if(prev.adm)await F.deleteDoc(F.doc(db,"admins",em));
    if(v&&v!=="owner"&&v!=="admin")await F.setDoc(F.doc(db,"userroles",em),{role:v,at:F.serverTimestamp()});else if(prev.ur)await F.deleteDoc(F.doc(db,"userroles",em));
    showMsg(L("Rolle gespeichert."),2500)}
  catch(err){console.error(err);setLocal(prev.own,prev.adm,prev.ur);render();
    showMsg(/permission/.test((err&&err.code)||"")?L("Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln)."):L("Fehler:")+" "+(err.message||err),9000)}},true);
/* user list: one compact card per person, filter chips with counts, actions folded away */
const initials=n=>String(n||"?").split(/[\s@._-]+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join("")||"?";
function userList(rows,vis,o){
  const F=[["all","Alle"],["online","Online"],["act","Aktiv"],["inv","Eingeladen"],["off","Gesperrt"],["adm","Mit Rolle"]];
  const chips='<div class="ufil" role="group">'+F.filter(([k])=>k==="all"||ADM.cnt[k]).map(([k,t])=>'<button type="button" data-uf="'+k+'" aria-pressed="'+(ADM.uf===k)+'">'+L(t)+' <span>'+ADM.cnt[k]+'</span></button>').join("")+'</div>';
  const card=r=>{
    const own=o.own,isOwn=ADMINS.includes(r.email),cp=crewPerson(r.email)||{},open=ADM.edit===r.email||ADM.act===r.email,nm=r.name||cp.name||"";
    const badge=o.isAdm(r.email)?'<span class="ust adm">'+L(isOwn?"Owner":"Admin")+'</span>':(o.roleOf(r.email)?'<span class="ust role">'+esc(o.roleName(o.roleOf(r.email)))+'</span>':'<span class="ust norole">'+esc(L("Keine Rolle"))+'</span>');
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
      '<div class="usub">'+(cp.role||(r.m&&r.m.func)?esc(cp.role||r.m.func)+' · ':'')+'<a class="em" href="mailto:'+esc(r.email)+'">'+esc(r.email)+'</a>'+(r.m&&r.m.lang?' · '+esc(r.m.lang.toUpperCase()):'')+(r.m&&seenText(r.m)?' · <span class="useen'+(isOnline(r.m)?' on':'')+'">'+esc(seenText(r.m))+'</span>':'')+(r.m?' · <span class="utour">'+esc(tourInfo(r.m))+'</span>':'')+'</div>'+userInfo(r)+'</div>'+
      (hasActs?'<button type="button" class="umore" data-uact="'+esc(r.email)+'" aria-expanded="'+open+'" aria-label="'+esc(L("Aktionen"))+'" title="'+esc(L("Aktionen"))+'"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>':'')+'</div>'+
      (own&&ADM.pw&&ADM.pw[r.email]?'<div class="pwrow">'+L("Startpasswort")+': <b class="pwshow2">'+esc(ADM.pw[r.email])+'</b> <button type="button" data-pwshow="'+esc(r.email)+'">'+L("Anzeigen")+'</button></div>':'')+
      (open?'<div class="ubody">'+(canRole(r.email)?o.roleSel(r):'')+(o.cEd&&ADM.edit===r.email?editForm(r):'')+(acts.length?'<div class="aacts">'+acts.join("")+'</div>':'')+'</div>':'')+
    '</div>'};
  const SORTS=[["first","Vorname"],["name","Nachname"],["dept","Abteilung"],["status","Status"],["role","Rolle"],["new","Neueste zuerst"],["seen","Zuletzt online"],["email","E-Mail"]];
  const sortSel='<label class="usort">'+L("Sortieren")+' <select data-usort>'+SORTS.map(([k,t])=>'<option value="'+k+'"'+((ADM.sort||"first")===k?' selected':'')+'>'+L(t)+'</option>').join("")+'</select></label>';
  const onl=rows.filter(r=>r.m&&isOnline(r.m)).map(r=>r.name||(crewPerson(r.email)||{}).name||r.email);
  return '<div class="admins ulist"><h3>'+L("Benutzer:innen")+' <span class="ust">'+rows.length+'</span></h3>'+
    '<p class="uonline"><span class="odot" aria-hidden="true"></span>'+(onl.length?'<b>'+esc(L("Gerade aktiv"))+' ('+onl.length+'):</b> '+esc(onl.join(", ")):esc(L("Gerade ist niemand aktiv.")))+'</p>'+
    '<input class="search" id="aq" type="search" placeholder="'+esc(L("Name, E-Mail oder Funktion suchen"))+'" value="'+esc(ADM.q)+'">'+'<div class="ubar">'+chips+sortSel+'</div>'+
    (vis.length?'<div class="ucards">'+vis.map(card).join("")+'</div>':'<p class="ahint">'+L("Keine Treffer.")+'</p>')+'</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-uf]");if(b){ADM.uf=b.dataset.uf;render();return}
  const t=e.target.closest("[data-uact]");if(t){const em=t.dataset.uact;const was=ADM.act===em||ADM.edit===em;ADM.act=was?"":em;if(was||ADM.edit!==em)ADM.edit="";render()}});
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
   const by={name:(a,b)=>String(last(a)).localeCompare(last(b),LANG)||String(nmOf(a)).localeCompare(nmOf(b),LANG),first:(a,b)=>String(nmOf(a)).localeCompare(nmOf(b),LANG),status:(a,b)=>stOf(a)-stOf(b),role:(a,b)=>rk(a)-rk(b),new:(a,b)=>ts(b)-ts(a),seen:(a,b)=>seenMs(b.m)-seenMs(a.m),dept:(a,b)=>dep(a).localeCompare(dep(b),LANG),email:(a,b)=>a.email.localeCompare(b.email)};
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
    '<div class="arow"><span>'+esc(ADMINS[0])+'</span><span class="ust ok">'+L("Owner")+'</span></div>'+
    ADM.adm.map(e=>[e,((rows.find(r=>r.email===e)||{}).name)||(crewPerson(e)||{}).name||""]).sort((a,b)=>(a[1]||a[0]).localeCompare(b[1]||b[0],LANG)).map(([e,n])=>'<div class="arow"><span>'+esc(n||e)+'</span><button data-adm="rmadmin" data-em="'+esc(e)+'">'+L("Entfernen")+'</button></div>').join("")+
    '</div>':'';
  const srcInner=()=>{const x=typeof srcHTML==="function"?srcHTML():"";return x?x.replace(/^<details[^>]*><summary>[\s\S]*?<\/summary>/,'<div class="src srcin">').replace(/<\/details>$/,'</div>'):'<p class="ghint">–</p>'};
  /* Einstellungen: one form (id setform) whose fields sit in collapsible groups – all open by default */
  const sv='<div class="arb"><button type="submit" form="setform">'+L("Speichern")+'</button></div>';
  const grp=(k,t,body)=>'<details class="admins asetd setgrp alangs" data-sec="set-'+k+'"'+(SECS["set-"+k]!==false?' open':'')+'><summary>'+L(t)+'</summary>'+(k==="up"?'<button type="button" class="uprf" data-dorefresh aria-label="'+esc(L("Daten jetzt aktualisieren"))+'" title="'+esc(L("Daten jetzt aktualisieren"))+'"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button>':'')+body+'</details>';
  const setSec=can("settings")?'<form id="setform" class="alangs" data-adm="langs" novalidate></form>'+
    grp("up","Aktualisieren",(own?upSec():'')+'<p class="ahint"><b>Dropbox</b> – '+L("Eingeschaltet werden Drehplan, Drehbuch, Crewliste, Callsheets und Motivliste jede Stunde automatisch neu geladen (nur gelesen).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="au"'+(window.AUTOUPD!==false?' checked':'')+'> '+L("Daten aus der Dropbox automatisch laden")+'</label></div>'+'<p class="ahint"><b>'+L("Motivliste")+'</b> – '+L("Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.")+'</p><input form="setform" class="amap" type="url" name="sheet" inputmode="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(window.LOCSHEET||"")+'">'+sv)+
    grp("langs","Sprachen",'<p class="ahint"><b>'+L("Sprachen")+'</b> – '+L("Nur diese Sprachen stehen in der App zur Auswahl. Mindestens eine.")+'</p><div class="chk">'+LANGS.map(([k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="al" value="'+k+'"'+(APPLANGS.includes(k)?' checked':'')+'> '+t+'</label>').join("")+'</div>'+sv)+
    grp("areas","Bereiche",'<p class="ahint"><b>'+L("Bereiche")+'</b> – '+L("Nur die gewählten Bereiche erscheinen unten in der App. Mindestens einer.")+' '+L("Reihenfolge mit ▲ ▼ ändern.")+'</p><div class="tbord">'+tabOrder().map(k=>[k,{plan:"Schedule",dispo:"Callsheet",loc:"Locations",crew:"Crew",script:"Script",info:"Info"}[k]]).map(([k,t])=>'<div class="tbrow"><label class="ck"><input form="setform" type="checkbox" name="tb" value="'+k+'"'+(!Array.isArray(window.TABSON)||window.TABSON.includes(k)?' checked':'')+'> '+t+'</label><span class="tbmv"><button type="button" data-tmv="up" aria-label="'+esc(L("Nach oben"))+'">▲</button><button type="button" data-tmv="down" aria-label="'+esc(L("Nach unten"))+'">▼</button></span></div>').join("")+'</div>'+'<p class="ahint"><b>Units</b> – '+L("Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="u2"'+(window.UNIT2!==false?' checked':'')+'> '+L("2nd Unit anzeigen")+'</label><label class="ck"><input form="setform" type="checkbox" name="u3"'+(window.UNIT3===true?' checked':'')+'> '+L("3rd Unit anzeigen")+'</label></div>'+'<p class="ahint"><b>'+L("Drehbuch")+'</b> – '+L("Eingeschaltet erscheint bei jeder Szene der Knopf «Script», der die Szene im Drehbuch öffnet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="so"'+(window.SCRIPTON!==false?' checked':'')+'> '+L("Drehbuch anzeigen")+'</label></div>'+sv)+
    grp("misc","Einstellungen",'<p class="ahint"><b>'+L("Geburtstage")+'</b> – '+L("Eingeschaltet sehen alle Benutzer:innen in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="bp"'+(window.BDAYPUB===true?' checked':'')+'> '+L("Geburtstagsliste allen anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Anmeldung")+'</b> – '+L("Ausgeschaltet verschwindet «Mit Google anmelden» auf der Anmeldeseite. Wer schon mit Google angemeldet ist, bleibt angemeldet.")+'</p><div class="chk"><label class="ck"><input form="setform" type="checkbox" name="go"'+(window.GOOGLEON!==false?' checked':'')+'> '+L("Mit Google anmelden anbieten")+'</label></div>'+
    '<p class="ahint"><b>'+L("Benutzer:innen ohne Rolle")+'</b> – '+L("Personen ohne Rolle sehen weder Drehplan, Drehbuch noch Blocking. Hier kannst du ihnen zusätzlich freigeben:")+'</p><div class="chk">'+
      [["pp","phone","Telefonnummern"],["pe","email","E-Mail-Adressen"],["pm","mycal","Meine Termine"]].map(([n,k,t])=>'<label class="ck"><input form="setform" type="checkbox" name="'+n+'"'+(window.PUBV[k]!==false?' checked':'')+'> '+L(t)+'</label>').join("")+'</div>'+'<p class="ahint"><b>'+L("Karte")+'</b> – '+L("Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.")+'</p><input form="setform" class="amap" type="url" name="map" inputmode="url" placeholder="https://www.google.com/maps/d/…" value="'+esc(window.MAPURL||"")+'">'+(typeof chatSetSec==="function"?chatSetSec():'')+sv)+
    grp("src","Quellen",srcInner())+(own?grp("bk","Backup",bkSec()):''):(own?grp("up","Aktualisieren",upSec())+grp("src","Quellen",srcInner())+grp("bk","Backup",bkSec()):'');
  const SUBS=[];if(can("users.view")||can("users.invite")||can("users.requests")||can("users.edit"))SUBS.push(["users","Benutzerverwaltung"]);if(isAdmin())SUBS.push(["roles","Rollen"]);if(can("settings"))SUBS.push(["docs","Dokumente"],["set","Einstellungen"]);
  if(!SUBS.length)return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(!SUBS.some(x=>x[0]===ADM.sub))ADM.sub=SUBS[0][0];
  const subNav=SUBS.length>1?'<nav class="asub n'+SUBS.length+'" role="tablist">'+SUBS.map(([k,t])=>'<button type="button" role="tab" data-asub="'+k+'" aria-selected="'+(ADM.sub===k)+'">'+(t==="Benutzerverwaltung"?'<span class="lgl">'+esc(L(t))+'</span><span class="sml">'+esc(L("Benutzer"))+'</span>':esc(L(t)))+'</button>').join("")+'</nav>':'';
  let h='<section class="adm"><h2 class="dh">'+L("App-Verwaltung")+'</h2>'+subNav;
  if(ADM.sub==="set")return h+setSec+'</section>';
  if(ADM.sub==="docs")return h+docsSec()+'</section>';
  if(ADM.sub==="roles")return h+rolesSec()+'</section>';
  if(ADM.sub==="bk")return h+bkSec()+'</section>';
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
        if(inv)await F.updateDoc(F.doc(db,"invites",em),d);else await F.setDoc(F.doc(db,"invites",em),Object.assign(d,{addedAt:F.serverTimestamp()}));await assignCrew(em)}
      else if(g("rl"))await F.setDoc(F.doc(db,"invites",em),{name:[g("fn"),g("ln")].filter(Boolean).join(" "),role:g("rl"),addedAt:F.serverTimestamp()});await assignCrew(em);
      ADM.edit="";ADM.cedit="";showMsg(L("Gespeichert."),3000);await admLoad();render()}
    catch(err){console.error(err);if(btn)btn.disabled=false;showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const fl=e.target.closest('[data-adm="langs"]');
  if(fl){e.preventDefault();if(!can("settings"))return;const l=[...[...fl.elements].filter(x=>x.name==='al'&&x.checked)].map(x=>x.value);
    if(!l.length){showMsg(L("Bitte mindestens eine Sprache wählen."),4000);return}
    const tb=[...[...fl.elements].filter(x=>x.name==='tb'&&x.checked)].map(x=>x.value),tord=[...[...fl.elements].filter(x=>x.name==='tb')].map(x=>x.value);
    if(!tb.length){showMsg(L("Bitte mindestens einen Bereich wählen."),4000);return}
    try{const {F,db}=await fb();const u2=!!fl.elements['u2'].checked,u3=!!fl.elements['u3'].checked,bp=!!fl.elements['bp'].checked,so=!!fl.elements['so'].checked,au=!!fl.elements['au'].checked;const mu=String(fl.elements['map'].value||"").trim();
    if(mu&&!/^https:\/\/\S+$/.test(mu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const cu=String((fl.elements['chat']||{}).value||"").trim();if(cu&&!/^https:\/\/\S+$/.test(cu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const sh=String(fl.elements['sheet'].value||"").trim();
    if(sh&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(sh)){showMsg(L("Bitte einen Google-Sheets-Link eingeben."),4000);return}
    await F.setDoc(F.doc(db,"config","app"),{langs:l,unit2:u2,unit3:u3,mapUrl:mu,bdayPublic:bp,phonePublic:!!(fl.elements['pp']||{}).checked,emailPublic:!!(fl.elements['pe']||{}).checked,mycalPublic:!!(fl.elements['pm']||{}).checked,googleLogin:!!(fl.elements['go']||{}).checked,locSheet:sh,script:so,tabs:tb,tabOrder:tord,autoUpdate:au,chatUrl:cu,chatEnabled:!!(fl.elements['ca']||{}).checked,tourEnabled:!!(fl.elements['to']||{}).checked},{merge:true});window.CHATEN=!!(fl.elements['ca']||{}).checked;window.TOUREN=!!(fl.elements['to']||{}).checked;try{localStorage.setItem("appchaton",window.CHATEN?"1":"0");localStorage.setItem("apptouron",window.TOUREN?"1":"0")}catch(_){}window.CHATURL=cu;try{localStorage.setItem("appchat",cu)}catch(_){}window.TABORDER=tord;try{localStorage.setItem("apptaborder",JSON.stringify(tord))}catch(_){}window.AUTOUPD=au;try{localStorage.setItem("appauto",au?"1":"0")}catch(_){}window.TABSON=tb;try{localStorage.setItem("apptabs",JSON.stringify(tb))}catch(_){}window.SCRIPTON=so;try{localStorage.setItem("appscript",so?"1":"0")}catch(_){}window.LOCSHEET=sh;APPLANGS=l;window.UNIT2=u2;window.UNIT3=u3;window.BDAYPUB=bp;if(bp)syncBdays(true);try{localStorage.setItem("appbdaypub",bp?"1":"0")}catch(_){}window.MAPURL=mu;try{localStorage.setItem("applangs",JSON.stringify(l));localStorage.setItem("appunit2",u2?"1":"0");localStorage.setItem("appunit3",u3?"1":"0");localStorage.setItem("appmap",mu)}catch(_){}applyLangs();render();showMsg(L("Einstellungen gespeichert."),3000)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const f=e.target.closest('[data-adm="add"]');if(!f)return;e.preventDefault();
  const em=lc(f.em.value),nm=f.nm.value.trim();if(!/@/.test(em))return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"invites",em),{name:nm,addedAt:F.serverTimestamp()});await assignCrew(em);showMsg(em+" "+L("eingeladen."),3000);await admLoad()}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
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
      if(!ADM.inv.some(i=>i.id===em))await F.setDoc(F.doc(db,"invites",em),{name:"",role:"",addedAt:F.serverTimestamp()});await assignCrew(em);
      showMsg(em+" "+L("ist freigeschaltet. Die Person meldet sich einfach an – oder tippt auf «Ich habe bestätigt»."),7000);await admLoad();return}
    if(a==="pwreset"){ADM.busy=false;if(!isOwner())return;const em=b.dataset.em;
      if(!confirmSafe(L("{e} einen Link schicken, mit dem die Person ein neues Passwort festlegt?").replace("{e}",em)))return;
      const {A,auth}=await fb();await sendMailSafe((x,set)=>A.sendPasswordResetEmail(auth,x,set),em);
      showMsg(L("Link für ein neues Passwort gesendet an")+" "+em+". "+L("Schau auch im Spam-Ordner nach."),6000);return}
    if(a==="reqok"||a==="reqno"){const em=b.dataset.em,q=(ADM.req||[]).find(x=>x.id===em)||{};
      if(a==="reqok"){await F.setDoc(F.doc(db,"invites",em),{name:String(q.name||"").slice(0,80),role:String(q.role||"").slice(0,80),addedAt:F.serverTimestamp()});await assignCrew(em);await notifyApproved(em,q)}
      await F.deleteDoc(F.doc(db,"requests",em));ADM.req=(ADM.req||[]).filter(x=>x.id!==em);
      showMsg(a==="reqok"?L("Freigeschaltet:")+" "+(q.name||em):L("Anfrage abgelehnt."),4000);ADM.busy=false;await admLoad();return}
    if(a==="crew"){const list=crewEmails().filter(c=>!ADM.inv.some(i=>i.id===c.email)&&!ADM.mem.some(m=>m.email===c.email));
      if(confirmSafe(L("{n} Adressen aus der Crewliste einladen?").replace("{n}",list.length))){
        for(let i=0;i<list.length;i+=200){const batch=F.writeBatch(db);list.slice(i,i+200).forEach(c=>{batch.set(F.doc(db,"invites",c.email),{name:c.name,role:c.role,addedAt:F.serverTimestamp()});if(!ADM.ur[c.email]&&!ADM.adm.includes(c.email)&&!ADMINS.includes(c.email))batch.set(F.doc(db,"userroles",c.email),{role:"crew",at:F.serverTimestamp()})});await batch.commit()}
        showMsg(L("{n} Adressen eingeladen.").replace("{n}",list.length),4000)}}
    else if((a==="block"||a==="remove"||a==="uninvite")&&ADMINS.includes(b.dataset.em||(ADM.mem.find(m=>m.uid===b.dataset.uid)||{}).email)){showMsg(L("Der Owner kann nicht gesperrt oder entfernt werden."),4000)}
    else if(a==="block"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:false});showMsg(L("Gesperrt."),3000)}
    else if(a==="unblock"){await F.updateDoc(F.doc(db,"members",b.dataset.uid),{active:true});showMsg(L("Entsperrt."),3000)}
    else if(a==="remove"){if(confirmSafe(L("{e} entfernen? Die Person kommt danach nicht mehr in die App.").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"invites",b.dataset.em)).catch(()=>{});await F.deleteDoc(F.doc(db,"members",b.dataset.uid));showMsg(L("Entfernt."),3000)}}
    else if(a==="mkadmin"&&isAdmin()&&!ADMINS.includes(b.dataset.em)){await F.setDoc(F.doc(db,"admins",b.dataset.em),{addedAt:F.serverTimestamp()});showMsg(b.dataset.em+" "+L("ist jetzt Admin."),3000)}
    else if(a==="rmadmin"&&isAdmin()&&!ADMINS.includes(b.dataset.em)){if(confirmSafe(L("{e} die Admin-Rechte entziehen?").replace("{e}",b.dataset.em))){await F.deleteDoc(F.doc(db,"admins",b.dataset.em));showMsg(L("Admin-Rechte entzogen."),3000)}}
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
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"invites",em),{name:String(b.dataset.nm||"").slice(0,80),role:String(b.dataset.rl||"").slice(0,80),addedAt:F.serverTimestamp()});await assignCrew(em);
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
const CICO={edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',add:'<circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/><path d="M19 8v6M16 11h6"/>'};
const cico=(k,label,attrs,extra)=>'<button type="button" class="cico'+(extra||"")+'" '+attrs+' aria-label="'+esc(label)+'" title="'+esc(label)+'"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+CICO[k]+'</svg></button>';
window.crewExtra=function(p){
  /* «Kontoinfos» (owner and everyone allowed to change user data): account status, edit user data, role */
  const ACC=ADMV.acct&&(isOwner()||can("users.edit"));
  if(!p||!(can("crew.food")||can("crew.bday")||can("users.edit")))return"";
  if(!ADM.loaded){ensureAdm();return ADM.err||!(AV("food")||AV("bday")||ACC)?"":'<div class="pinfo"><span class="na">…</span></div>'}
  const m=memberFor(p),ch=[],na=t=>'<span class="na">'+esc(t)+'</span>';
  /* admins edit the person's user data right here (same form as in App-Verwaltung) */
  const ue=m?m.email:lc(p.email),uinv=ue&&ADM.inv.some(i=>i.id===ue),canEd=ACC&&can("users.edit")&&(m||uinv)&&(isOwner()||!ADMINS.includes(ue));
  const edBtn=canEd?cico(ADM.cedit===ue?"close":"edit",L(ADM.cedit===ue?"Schliessen":"Benutzerdaten bearbeiten"),'data-ced="'+esc(ue)+'" aria-expanded="'+(ADM.cedit===ue)+'"',ADM.cedit===ue?" on":""):"";
  const edForm=canEd&&ADM.cedit===ue?editForm({email:ue,m,name:p.name,role:p.role},false):"";
  const rSel=ACC&&canRole(ue)&&(m||uinv)?roleSel({email:ue}):"";
  if(!(AV("food")||AV("bday")||ACC))return "";
  if(ACC){
    if(!m){const e=lc(p.email),inv=e&&ADM.inv.some(i=>i.id===e);ch.push(na(L(inv?"Eingeladen, noch kein Konto":"Noch kein Konto")));
      if(inv&&isAdmin())ch.push(cico("mail",L("Einladungs-Mail schicken"),'data-cmail="'+esc(e)+'" data-nm="'+esc(p.name||"")+'"'));
      if(!inv&&isOwner()&&e&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))ch.push(cico("add",L("Als Benutzer:in einladen"),'data-cinv="'+esc(e)+'" data-nm="'+esc(p.name||"")+'" data-rl="'+esc(p.role||"")+'"'))}
    else ch.push(m.active===true?'<span class="ok">'+esc(L("Konto aktiv"))+'</span>':'<span class="off">'+esc(L("Gesperrt"))+'</span>');
    const ems=[lc(p.email),m&&m.email].filter(Boolean);
    if(ems.some(e=>ADMINS.includes(e)))ch.push('<span class="adm">'+esc(L("Owner"))+'</span>');
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
      if(!u){ME=null;MYPERMS=[];{const w=document.getElementById("welcome");if(w)w.remove();WELCOME_OPEN=false}acctButton(false);clearLocal();if(window.resetViewState)window.resetViewState();if(S.tab==="admin"||S.tab==="acct")S.tab="plan";render();
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

/* Hindi (हिन्दी): texts of the app; missing ones fall back to English. Main topics and titles are translated only in Hindi */
{const HI={"Anfahrt":"रास्ता","Planung":"Schedule","Callsheet":"कॉलशीट","Locations":"लोकेशन","Crew":"क्रू","Infos":"Info","Suchen":"खोजें","Aktualisieren":"अपडेट करें","Schliessen":"बंद करें","Szene, Ort, Person, Cast …":"सीन, जगह, व्यक्ति, Cast …","Daten werden geladen …":"डेटा लोड हो रहा है …","Regie":"निर्देशन","Kompars.":"एक्स्ट्रा","Ort: TBA":"लोकेशन: TBA","Szene":"सीन","Szenen":"सीन","Motive":"सेट","Ort":"जगह","Orte":"जगहें","Reise":"यात्रा","Frei":"छुट्टी","Reisetag":"यात्रा दिवस","Drehfrei":"छुट्टी का दिन","Callsheet folgt":"Callsheet जल्द आएगी","heute":"आज","Dreh":"शूट","Länge":"अवधि","Seiten":"पेज","Sonne":"सूर्य","Kompars:innen":"एक्स्ट्रा","Crew suchen":"Crew खोजें","Niemand gefunden für":"कोई नहीं मिला:","Kopieren":"कॉपी करें","Kopiert":"कॉपी हो गया","Szenenbeschrieb":"सीन विवरण","Adresse":"पता","Cast":"Cast","Drehbuch":"स्क्रिप्ट","Diese Szene ist im Drehbuch nicht gefunden worden.":"यह सीन Script में नहीं मिला।","Drehbuch konnte nicht geladen werden.":"Script लोड नहीं हो सकी।","Kontakt ins Telefon übernehmen":"फ़ोन में संपर्क जोड़ें","Adressen im Dorf":"गाँव में पते","Keine Locations für diese Unit.":"इस यूनिट के लिए कोई Locations नहीं।","Keine 2nd Unit an diesem Tag.":"इस दिन कोई 2nd Unit नहीं।","Keine 3rd Unit an diesem Tag.":"इस दिन कोई 3rd Unit नहीं।","Bitte mindestens eine Unit wählen.":"कृपया कम से कम एक यूनिट चुनें।","Alle Szenen auf- oder zuklappen":"सभी सीन खोलें या बंद करें","Das Callsheet erscheint hier automatisch, sobald es im Dropbox-Ordner 06_Callsheets liegt, meist am Vorabend.":"Callsheet Dropbox फ़ोल्डर 06_Callsheets में आते ही यहाँ अपने आप दिखेगी, आमतौर पर एक शाम पहले।","Laut Planung: Drehzeit":"Schedule के अनुसार: शूटिंग","Planung ansehen":"Schedule देखें","Drehbeginn":"पहला शॉट","Wetter":"मौसम","Parken":"पार्किंग","Treffpunkt & Orte":"मिलने की जगह और लोकेशन","Base / Treffpunkt":"Base / मिलने की जगह","Drehort":"लोकेशन","Zeiten":"समय","Rolle":"भूमिका","Darsteller:in":"कलाकार","Maske":"मेकअप","Kostüm":"कॉस्ट्यूम","Notfall & Kontakte":"आपातकाल और संपर्क","Nächstes Spital":"नज़दीकी अस्पताल","Spital":"अस्पताल","Original-Callsheet öffnen":"मूल Callsheet खोलें","ist noch leer. Die Daten kommen automatisch aus der Dropbox der Produktion.":"अभी खाली है। डेटा प्रोडक्शन की Dropbox से अपने आप आता है।","Lade":"लोड हो रहा है","Quellen (Dropbox, nur gelesen):":"स्रोत (Dropbox, केवल पढ़ने के लिए):","geprüft":"जाँचा गया","Noch keine Daten eingespielt.":"अभी कोई डेटा नहीं।","Suche nach Szenennummer (z. B. 186), Drehtag (D5, Day 5, 26.10., Montag, heute, morgen), Motiv, Adresse, Rolle (z. B. Regina), Crew-Name, Funktion oder Telefonnummer.":"सीन नंबर (जैसे 186), शूटिंग दिवस (D5, Day 5, 26.10., सोमवार, आज, कल), सेट, पता, भूमिका (जैसे Regina), Crew नाम, काम या फ़ोन नंबर से खोजें।","Drehtage":"शूटिंग दिवस","Salgesch, mehrere Adressen":"Salgesch, कई पते","Tagesdispo":"Callsheet","Nichts gefunden für":"कुछ नहीं मिला:","Datenbank nicht erreichbar. Bitte mit einem Claude-Konto anmelden.":"डेटाबेस उपलब्ध नहीं। कृपया Claude खाते से साइन इन करें।","Neueste Daten geladen.":"नवीनतम डेटा लोड हुआ।","Dropbox zuletzt geprüft":"Dropbox पिछली बार जाँची गई","Daten konnten nicht geladen werden. Bitte Internetverbindung prüfen.":"डेटा लोड नहीं हो सका। कृपया इंटरनेट कनेक्शन जाँचें।","Dropbox wird geprüft. Das dauert 1–3 Minuten, die App aktualisiert sich danach von selbst.":"Dropbox जाँची जा रही है। इसमें 1–3 मिनट लगते हैं; उसके बाद ऐप अपने आप अपडेट हो जाएगा।","Zugriff nicht erlaubt. Bitte die Berechtigung der App erlauben und erneut tippen.":"एक्सेस की अनुमति नहीं। कृपया ऐप को अनुमति दें और फिर से टैप करें।","Aktualisierung konnte nicht gestartet werden":"अपडेट शुरू नहीं हो सका","Die Aktualisierung braucht länger als üblich. Die App übernimmt die Daten automatisch, sobald sie fertig ist.":"अपडेट में सामान्य से ज़्यादा समय लग रहा है। पूरा होते ही ऐप डेटा अपने आप ले लेगा।","Geprüft: keine neuen Dateien in der Dropbox.":"जाँचा गया: Dropbox में कोई नई फ़ाइल नहीं।","Aktualisiert.":"अपडेट हो गया।","Vorheriger Song":"पिछला गाना","Nächster Song":"अगला गाना","Abspielen":"चलाएँ","Pause":"रोकें","Drehtage-Leiste":"दिन","Unit filtern":"यूनिट फ़िल्टर करें","Dunkler Modus":"डार्क मोड","Heller Modus (gut lesbar)":"लाइट मोड (पढ़ने में आसान)","Vorherige Szene lesen":"पिछला सीन पढ़ें","Folgende Szene lesen":"अगला सीन पढ़ें","Vorherige Szene":"पिछला सीन","Folgende Szene":"अगला सीन","Quellen":"स्रोत","Drehplan":"Schedule","Crewliste":"Crew सूची","Motivliste":"लोकेशन सूची","Stand":"स्थिति:","Dropbox der Produktion, nur gelesen.":"प्रोडक्शन की Dropbox, केवल पढ़ने के लिए।","Zuletzt geprüft":"पिछली जाँच","Karte":"नक्शा","Karte der Drehorte":"शूटिंग लोकेशनों का नक्शा","Infobox":"Info बॉक्स","Drehbuch hell / dunkel":"Script लाइट / डार्क","Drehzeit":"शूटिंग समय","Tag":"दिन","Abend":"शाम","Nacht":"रात","Szene, Motiv, Rolle, Text …":"सीन, सेट, भूमिका, टेक्स्ट …","nicht geplant":"निर्धारित नहीं","Weitere Szenen anzeigen":"और सीन दिखाएँ","Location, Adresse, Szene …":"लोकेशन, पता, सीन …","Zuletzt gelesen":"पिछली बार पढ़ा","Drehtag":"शूटिंग दिवस","Drehtag & Zeit":"शूटिंग दिवस और समय","Englische Szenenbezeichnung":"अंग्रेज़ी सीन नाम","Treffer im Drehplan (Motiv, Cast oder Beschreibung)":"Schedule में मिलान (सेट, Cast या विवरण)","Position":"पद","Vorbereitung & Proben":"तैयारी और रिहर्सल","Die Wochenplanung für Vorbereitung und Proben folgt, sobald sie in der Dropbox der Produktion verfügbar ist.":"तैयारी और रिहर्सल की साप्ताहिक योजना प्रोडक्शन की Dropbox में उपलब्ध होते ही आएगी।","Parallel":"समानांतर","Transport":"परिवहन","Fahrer:in":"ड्राइवर","Kontakte":"संपर्क","Quelle":"स्रोत","Basis & Unterkünfte":"Base और आवास","Verteiler":"वितरण सूची","In den Kalender":"कैलेंडर में जोड़ें","E-Mail-Verteiler":"ई-मेल सूची","Gruppen":"समूह","Keine Adressen gefunden.":"कोई पता नहीं मिला।","Nicht in Crewliste oder bei den Benutzer:innen":"Crew सूची या यूज़र्स में नहीं","Mail an alle":"सभी को मेल","Adressen kopieren":"पते कॉपी करें","In der Crewliste, aber ohne E-Mail":"Crew सूची में, पर ई-मेल नहीं","Teilnehmende":"प्रतिभागी","Teilnehmende ein-/ausblenden":"प्रतिभागी दिखाएँ/छिपाएँ","Prep-Wochenplanung":"Prep साप्ताहिक Schedule","ab":"से","Meine Termine":"मेरा Schedule","Termine für":"Schedule:","Bitte oben deinen Namen wählen.":"कृपया ऊपर अपना नाम चुनें।","Keine kommenden Termine gefunden.":"कोई आगामी कार्यक्रम नहीं मिला।","Alle in den Kalender":"सभी कैलेंडर में जोड़ें","Dein Name wurde in der Crewliste nicht gefunden.":"आपका नाम Crew सूची में नहीं मिला।","Diese Ansicht konnte nicht angezeigt werden.":"यह दृश्य नहीं दिखाया जा सका।","Film wird geladen …":"फ़िल्म लोड हो रही है …","Film konnte nicht geladen werden.":"फ़िल्म लोड नहीं हो सकी।","Klein":"छोटा","Mittel":"मध्यम","Gross":"बड़ा","Liste":"सूची","Fotos":"फ़ोटो","Videos":"वीडियो","Diashow":"स्लाइडशो","Diashow anhalten":"स्लाइडशो रोकें","Ordner in Dropbox öffnen":"Dropbox में फ़ोल्डर खोलें","Video in Dropbox abspielen":"Dropbox में वीडियो चलाएँ","Original in Dropbox":"Dropbox में मूल","Alle Bilder":"सभी तस्वीरें","Weiter":"आगे","aus dem App-Profil":"ऐप प्रोफ़ाइल से","spricht im Drehbuch":"Script में बोलता/बोलती है","erwähnt im Drehbuch":"Script में उल्लेख","spricht im Drehbuch, fehlt im Drehplan":"Script में बोलता/बोलती है, Schedule में नहीं","nur erwähnt, nicht im Drehplan":"केवल उल्लेख, Schedule में नहीं","Suchen nach":"इससे खोजें","Alle":"सभी","Person":"व्यक्ति","Motiv":"Location","Text":"टेक्स्ट","Rolle eingeben, z. B. Regina oder 8. Leer lassen für die Liste aller Rollen.":"भूमिका दर्ज करें, जैसे Regina या 8। सभी भूमिकाओं की सूची के लिए खाली छोड़ें।","Szenennummer eingeben, z. B. 186 oder 4A.":"सीन नंबर दर्ज करें, जैसे 186 या 4A।","Drehtag eingeben: D5, 26.10., Montag, heute oder morgen.":"दिन दर्ज करें: D5, 26.10., सोमवार, आज या कल।","Name, Funktion oder Telefonnummer eingeben.":"नाम, काम या फ़ोन नंबर दर्ज करें।","Motiv oder Adresse eingeben, z. B. Kapelle oder Salgesch.":"Location या पता दर्ज करें, जैसे चैपल या Salgesch।","Wörter aus Szenenbeschrieb, Notizen oder Infos eingeben.":"सीन विवरण, नोट्स या Info के शब्द दर्ज करें।","Name der Schauspielerin oder des Schauspielers eingeben (aus den Callsheets).":"अभिनेता का नाम दर्ज करें (Callsheets से)।","Wörter aus dem Drehbuchtext eingeben.":"Script के टेक्स्ट से शब्द दर्ज करें।","Keine Rollen in der Besetzungsliste.":"Cast सूची में कोई भूमिका नहीं।","Geplante Szenen, in denen die Rolle laut Drehbuch spricht, aber nicht im Drehplan steht – oder im Drehplan steht, im Drehbuch aber nicht vorkommt.":"नियोजित सीन जिनमें भूमिका Script में बोलती है पर Schedule में नहीं है – या Schedule में है पर Script में नहीं आती।","im Drehbuch":"Script में","im Drehplan":"Schedule में","Drehplan und Drehbuch":"Schedule और Script","nur im Drehplan":"केवल Schedule में","nur im Drehbuch":"केवल Script में","Blocking & Floorplans":"Blocking & Floorplans","Ich":"मैं","Name tippen …":"नाम टाइप करें …","Zum Startbildschirm hinzufügen?":"होम स्क्रीन पर जोड़ें?","Dann öffnest du die Crew-App wie eine normale App, ohne Link.":"फिर आप Crew ऐप को सामान्य ऐप की तरह खोलेंगे, लिंक की ज़रूरत नहीं।","Ja, hinzufügen":"हाँ, जोड़ें","Später":"बाद में","Ist schon drauf":"पहले से है","So geht's auf dem iPhone:":"iPhone पर:","1. Unten auf Teilen tippen":"1. नीचे Share पर टैप करें","2. «Zum Home-Bildschirm» wählen":"2. “Add to Home Screen” चुनें","3. Oben rechts «Hinzufügen» tippen":"3. ऊपर दाईं ओर “Add” टैप करें","So geht's:":"ऐसे करें:","1. Browser-Menü ⋮ öffnen":"1. ब्राउज़र मेनू ⋮ खोलें","2. «Zum Startbildschirm hinzufügen» oder «App installieren» wählen":"2. “होम स्क्रीन पर जोड़ें” या “ऐप इंस्टॉल करें” चुनें","Fertig":"हो गया","Danach die App vom Startbildschirm öffnen und dort einmal anmelden.":"फिर होम स्क्रीन से ऐप खोलें और वहाँ एक बार साइन इन करें।","Anmelden":"साइन इन","E-Mail":"ईमेल","Passwort":"पासवर्ड","Passwort wiederholen":"पासवर्ड दोबारा","Neues Passwort":"नया पासवर्ड","Aktuelles Passwort":"मौजूदा पासवर्ड","Neue E-Mail-Adresse":"नया ईमेल पता","Konto erstellen":"खाता बनाएँ","Erstes Mal hier? Konto erstellen":"पहली बार? खाता बनाएँ","Schon ein Konto? Anmelden":"पहले से खाता है? साइन इन करें","Passwort vergessen?":"पासवर्ड भूल गए?","Link zum Zurücksetzen senden":"रीसेट लिंक भेजें","Zurück":"वापस","Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die du der Produktion angegeben hast.":"केवल TSCHUGGER Tigerblood की Crew के लिए। वही ईमेल पता इस्तेमाल करें जो आपने प्रोडक्शन को दिया है।","Mindestens 8 Zeichen.":"कम से कम 8 अक्षर।","Die Passwörter stimmen nicht überein.":"पासवर्ड मेल नहीं खाते।","E-Mail oder Passwort falsch.":"ईमेल या पासवर्ड गलत।","Für diese Adresse gibt es schon ein Konto. Bitte anmelden.":"इस पते का खाता पहले से है। कृपया साइन इन करें।","Ungültige E-Mail-Adresse.":"अमान्य ईमेल पता।","Zu viele Versuche. Bitte kurz warten.":"बहुत ज़्यादा प्रयास। कृपया थोड़ा रुकें।","Bitte bestätige zuerst deine E-Mail-Adresse.":"कृपया पहले अपना ईमेल पता पुष्टि करें।","Wir haben dir eine Mail mit einem Bestätigungslink geschickt. Tippe auf den Link und komm dann hierher zurück.":"हमने आपको पुष्टि लिंक वाला ईमेल भेजा है। लिंक पर टैप करें, फिर यहाँ लौटें।","Ich habe bestätigt":"मैंने पुष्टि कर दी","Mail nochmals senden":"ईमेल फिर से भेजें","Mail gesendet.":"ईमेल भेजा गया।","Noch nicht bestätigt. Schau auch im Spam-Ordner nach.":"अभी पुष्टि नहीं हुई। स्पैम फ़ोल्डर भी देखें।","Wenn es für diese Adresse ein Konto gibt, kommt gleich eine Mail zum Zurücksetzen.":"यदि इस पते का खाता है, तो रीसेट ईमेल आ रहा है।","Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die auf der Crewliste steht – diese ist bereits freigeschaltet.":"केवल TSCHUGGER Tigerblood की Crew के लिए। Crew सूची वाले ईमेल पते से साइन इन करें – वह पहले से अधिकृत है।","Diese E-Mail-Adresse ist nicht für die Crew-App freigeschaltet.":"यह ईमेल पता Crew ऐप के लिए अधिकृत नहीं है।","Bitte melde dich ab und wieder an – mit der E-Mail-Adresse, die auf der Crewliste steht. Diese ist bereits freigeschaltet. Bei Google: das Google-Konto mit dieser Adresse wählen. Stimmt die Adresse auf der Crewliste nicht, melde dich bei der Produktion.":"कृपया साइन आउट करें और Crew सूची वाले ईमेल पते से फिर साइन इन करें। वह पहले से अधिकृत है। Google से: उसी पते वाला Google खाता चुनें। यदि Crew सूची में पता गलत है, तो प्रोडक्शन से संपर्क करें।","Abmelden und mit Crewliste-Adresse anmelden":"साइन आउट करें और Crew सूची का पता इस्तेमाल करें","Zugang bei der Produktion anfragen":"प्रोडक्शन से एक्सेस माँगें","Vor- und Nachname":"पहला और अंतिम नाम","Funktion / Department":"काम / विभाग","Nachricht (optional)":"संदेश (वैकल्पिक)","Anfrage senden":"अनुरोध भेजें","Bitte Vor- und Nachname angeben.":"कृपया अपना पहला और अंतिम नाम दर्ज करें।","Anfrage gesendet. Du bekommst Zugang, sobald die Produktion sie freigibt – du erhältst dann eine E-Mail, oder tippe hier auf «Aktualisieren».":"अनुरोध भेजा गया। प्रोडक्शन की मंज़ूरी मिलते ही एक्सेस मिलेगा – आपको ईमेल आएगा, या यहाँ “रीफ़्रेश” टैप करें।","Anfragen von Benutzer:innen":"उपयोगकर्ता अनुरोध","Keine offenen Anfragen.":"कोई खुला अनुरोध नहीं।","Anfragen nicht lesbar":"अनुरोध पढ़े नहीं जा सके","Mail wird gesendet …":"ईमेल भेजा जा रहा है …","Mail gesendet um":"ईमेल भेजा गया:","Zu viele Versuche – bitte in ein paar Minuten nochmals.":"बहुत ज़्यादा प्रयास – कृपया कुछ मिनट बाद फिर कोशिश करें।","Gmail-Adresse? Dann geht es ohne Bestätigungs-Mail:":"Gmail पता? तो पुष्टि ईमेल की ज़रूरत नहीं:","Absender: noreply@tschugger-83692.firebaseapp.com – bitte auch im Spam- bzw. Junk-Ordner nachsehen und die Mail als «Kein Spam» markieren.":"प्रेषक: noreply@tschugger-83692.firebaseapp.com – कृपया स्पैम/जंक फ़ोल्डर भी देखें और ईमेल को “स्पैम नहीं” चिह्नित करें।","Automatische Aktualisierung (Dropbox → Webseite)":"स्वचालित अपडेट (Dropbox → वेबसाइट)","Läuft":"चल रहा है","zuletzt geprüft":"आख़िरी जाँच","Daten vom":"डेटा दिनांक","In den App-Einstellungen ausgeschaltet":"ऐप सेटिंग्स में बंद","Fehler beim letzten Lauf":"पिछले रन में त्रुटि","Noch nicht eingerichtet":"अभी सेट नहीं","es fehlen":"गायब","Lade …":"लोड हो रहा है …","GitHub liest die Dropbox zweimal pro Stunde (nur lesend), wandelt neue Drehpläne, Crewlisten, Dispos und das Drehbuch um und veröffentlicht sie verschlüsselt auf der Webseite – ohne dass ein Computer laufen muss.":"GitHub घंटे में दो बार Dropbox पढ़ता है (केवल पढ़ना), नए Schedules, Crew सूचियाँ, Callsheets और Script को बदलकर वेबसाइट पर एन्क्रिप्टेड प्रकाशित करता है – किसी कंप्यूटर को चालू रखने की ज़रूरत नहीं।","Dropbox-Zugang (nur lesend) erzeugen:":"Dropbox एक्सेस बनाएँ (केवल पढ़ना):","Claude-API-Schlüssel erstellen:":"Claude API कुंजी बनाएँ:","den Schlüssel der Crew-Daten bekommst du von Claude im Chat.":"Crew डेटा की कुंजी आपको चैट में Claude से मिलेगी।","Alle vier in GitHub eintragen:":"चारों को GitHub में दर्ज करें:","Ersten Lauf starten:":"पहला रन शुरू करें:","Alle Texte, die die App verschickt oder anzeigt. Platzhalter: {vorname} {name} {email} {app} {passwort} {disclaimer}. Du bearbeitest jeweils nur die gewählte Sprache; ohne eigenen Text gilt die Standardfassung.":"ऐप द्वारा भेजे या दिखाए जाने वाले सभी टेक्स्ट। प्लेसहोल्डर: {vorname} {name} {email} {app} {passwort} {disclaimer}। आप केवल चुनी गई भाषा संपादित करते हैं; अपने टेक्स्ट के बिना डिफ़ॉल्ट लागू होता है।","15 Min. vorher":"15 मिनट पहले","30 Min. vorher":"30 मिनट पहले","1 Std. vorher":"1 घंटा पहले","2 Std. vorher":"2 घंटे पहले","3 Std. vorher":"3 घंटे पहले","1 Tag vorher":"1 दिन पहले","Alle Drehtage":"सभी शूटिंग दिन","Alle Prep-Termine":"सभी Prep अपॉइंटमेंट","Termin":"अपॉइंटमेंट","Push-Nachrichten wurden im Browser nicht erlaubt.":"ब्राउज़र में सूचनाओं की अनुमति नहीं दी गई।","Test-Nachricht":"टेस्ट संदेश","So sehen Erinnerungen an deine Termine aus.":"आपके अपॉइंटमेंट के रिमाइंडर ऐसे दिखते हैं।","Push-Nachricht ausschalten":"सूचना बंद करें","Push-Nachricht an":"सूचना चालू","Dieser Browser unterstützt keine Push-Nachrichten.":"यह ब्राउज़र सूचनाएँ सपोर्ट नहीं करता।","Push-Nachrichten sind in den Einstellungen dieses Browsers blockiert. Erlaube sie dort für diese Seite.":"इस ब्राउज़र की सेटिंग्स में सूचनाएँ ब्लॉक हैं। वहाँ इस साइट के लिए अनुमति दें।","Auf diesem Gerät einschalten":"इस डिवाइस पर चालू करें","Auf diesem Gerät aktiv":"इस डिवाइस पर सक्रिय","Push-Nachrichten":"पुश सूचनाएँ","Erinnerungen an kommende Termine erhalten":"आने वाले अपॉइंटमेंट के रिमाइंडर पाएँ","Erinnern":"याद दिलाएँ","Für welche Termine?":"किन अपॉइंटमेंट के लिए?","Kommende Termine":"आने वाले अपॉइंटमेंट","Hier oder mit der Glocke in «Meine Termine» schaltest du einzelne Termine aus.":"यहाँ या “मेरे अपॉइंटमेंट” में घंटी से अलग-अलग अपॉइंटमेंट बंद करें।","Adresse des Cloudflare Workers für den Chat-Assistenten (und den zuverlässigen Zeitplan für Push und Dropbox). Leer = kein Assistent.":"असिस्टेंट के लिए Cloudflare Worker का पता (और पुश व Dropbox के लिए भरोसेमंद समय-सारणी)। खाली = कोई असिस्टेंट नहीं।","Alle Motive mit Adresse, Karte und den Szenen, die dort gedreht werden.":"पता, नक्शा और वहाँ शूट होने वाले सीन के साथ सभी Locations।","Alle deine kommenden Termine an einem Ort – mit «In den Kalender» und der Glocke für Push-Nachrichten.":"आपके सभी आने वाले अपॉइंटमेंट एक जगह – “कैलेंडर में जोड़ें” और सूचनाओं के लिए घंटी के साथ।","Allgemeine Infos zur Produktion und zur App.":"प्रोडक्शन और ऐप की सामान्य जानकारी।","Antworten ohne Gewähr – verbindlich sind die Unterlagen der Produktion.":"उत्तरों की कोई गारंटी नहीं – प्रोडक्शन के दस्तावेज़ ही मान्य हैं।","Assistent":"असिस्टेंट","Benutzer, Rollen, Dokumente und Einstellungen – nur mit Berechtigung sichtbar.":"उपयोगकर्ता, भूमिकाएँ, दस्तावेज़ और सेटिंग्स – केवल अनुमति होने पर दिखते हैं।","Bestätigungs-Mail, Passwort-Zurücksetzen und Anmelde-Link verschickt Firebase. Deren Texte änderst du in der Firebase-Konsole unter Authentication → Templates.":"पुष्टि ईमेल, पासवर्ड रीसेट और साइन-इन लिंक Firebase भेजता है। उनके टेक्स्ट Firebase कंसोल में Authentication → Templates में बदलें।","Chat-Assistent anzeigen (Knopf unten rechts)":"असिस्टेंट दिखाएँ (नीचे दाईं ओर बटन)","Das Drehbuch mit Suche.":"खोज के साथ Script।","Der Drehplan Tag für Tag: Szenen, Motive und Zeiten. Mit «Script» öffnest du eine Szene im Drehbuch, die Kamera zeigt Blocking-Fotos und -Filme.":"दिन-ब-दिन शूटिंग Schedule: सीन, Locations और समय। “Script” से सीन Script में खुलता है, कैमरा Blocking फ़ोटो और वीडियो दिखाता है।","Der Owner kann nicht gesperrt oder entfernt werden.":"Owner को ब्लॉक या हटाया नहीं जा सकता।","Die Crewliste nach Abteilungen – je nach Berechtigung mit Telefon und E-Mail.":"विभाग अनुसार Crew सूची – अनुमति के अनुसार फ़ोन और ईमेल के साथ।","Die Dispo des Drehtags: Crew Call, Drehbeginn, Wrap, Locations und Cast.":"दिन की Dispo: Crew Call, शूटिंग शुरू, Wrap, Locations और Cast।","Einführungstour":"परिचय टूर","Einführungstour anbieten":"परिचय टूर पेश करें","Eingeschaltet wird die Tour allen einmalig angeboten und kann unter «Mein Konto» neu gestartet werden.":"चालू होने पर टूर सभी को एक बार पेश किया जाता है और “मेरा खाता” में फिर शुरू किया जा सकता है।","Fertig!":"हो गया!","Frag den Assistenten, z. B. «Wo drehen wir morgen?» – er kennt die Daten der App.":"असिस्टेंट से पूछें, जैसे “कल हम कहाँ शूट कर रहे हैं?” – उसे ऐप का डेटा पता है।","Frag mich etwas zum Drehplan, zu Locations, zur Crew oder zur App.":"मुझसे Schedule, Locations, Crew या ऐप के बारे में पूछें।","Frage":"प्रश्न","Frage eingeben …":"अपना प्रश्न लिखें …","In einer Minute zeigen wir dir die wichtigsten Funktionen. Du kannst die Tour später jederzeit unter «Mein Konto» starten.":"एक मिनट में हम आपको मुख्य सुविधाएँ दिखाएँगे। टूर आप कभी भी “मेरा खाता” में शुरू कर सकते हैं।","KI-Assistent anbieten":"AI असिस्टेंट पेश करें","Kurze Tour durch die App?":"ऐप का छोटा टूर?","Los geht's":"चलिए शुरू करें","Neu":"नया","Profil, Push-Nachrichten, hell/dunkel, Passwort und Abmelden. Hier kannst du diese Tour jederzeit neu starten.":"प्रोफ़ाइल, सूचनाएँ, लाइट/डार्क, पासवर्ड और साइन आउट। यहाँ आप यह टूर फिर शुरू कर सकते हैं।","Senden":"भेजें","Standardtext wiederhergestellt.":"डिफ़ॉल्ट टेक्स्ट बहाल किया गया।","Suche":"खोज","Sucht über alles: Szenen, Rollen, Personen, Locations.":"सब कुछ खोजता है: सीन, भूमिकाएँ, लोग, Locations।","Test an mich":"मुझे टेस्ट भेजें","Tour gemacht":"टूर पूरा","Tour offen":"टूर बाकी","Tour starten":"टूर शुरू करें","Tour übersprungen":"टूर छोड़ा गया","Tour übersprungen – du findest sie unter «Mein Konto».":"टूर छोड़ा गया – यह “मेरा खाता” में मिलेगा।","Viel Spass mit der App. Die Tour findest du jederzeit wieder unter «Mein Konto».":"ऐप का आनंद लें। टूर आपको हमेशा “मेरा खाता” में मिलेगा।","Wann ist mein nächster Termin?":"मेरा अगला अपॉइंटमेंट कब है?","Wer ist die Regie?":"निर्देशक कौन है?","Wie funktioniert Meine Termine?":"मेरे अपॉइंटमेंट कैसे काम करता है?","Wo drehen wir morgen?":"कल हम कहाँ शूट कर रहे हैं?","Worker-Code und Anleitung":"Worker कोड और गाइड","angepasst":"अनुकूलित","Überspringen":"छोड़ें","Keine Verbindung.":"कोई कनेक्शन नहीं।","Der Assistent ist gerade nicht erreichbar.":"असिस्टेंट अभी उपलब्ध नहीं है।","Anzeigeoptionen":"प्रदर्शन विकल्प","Blende im Drehplan ein oder aus, was du sehen willst: Info, Szenenbeschrieb, Cast, Adresse und Blocking. Deine Auswahl bleibt gespeichert.":"Schedule में जो देखना है उसे दिखाएँ या छिपाएँ: Info, सीन विवरण, Cast, पता और Blocking। आपकी पसंद सेव रहती है।","Wähle, welche Units du siehst – zum Beispiel nur die 2nd Unit. Ist eine Unit an diesem Tag nicht im Einsatz, ist ihr Knopf blass.":"चुनें कि कौन-सी Units दिखें – जैसे केवल 2nd Unit। अगर उस दिन कोई Unit काम पर नहीं है, तो उसका बटन फीका रहता है।","Die App erinnert dich jetzt auf Wunsch vor deinen Terminen – auch wenn sie geschlossen ist.":"ऐप अब चाहें तो आपको आपके अपॉइंटमेंट से पहले याद दिला सकता है – बंद होने पर भी।","Einzelne Termine schaltest du mit der Glocke in «Meine Termine» aus; alles Weitere unter «Mein Konto».":"किसी एक अपॉइंटमेंट को “मेरे अपॉइंटमेंट” में घंटी से बंद करें; बाकी सब “मेरा खाता” में।","Nicht jetzt":"अभी नहीं","Einschalten":"चालू करें","Push-Nachrichten sind eingeschaltet.":"नोटिफ़िकेशन चालू हैं।","Du kannst Push-Nachrichten jederzeit unter «Mein Konto» einschalten.":"आप “मेरा खाता” में कभी भी नोटिफ़िकेशन चालू कर सकते हैं।","OK":"OK","Läufe auf GitHub ansehen":"GitHub पर रन देखें","Als Benutzer:in einladen":"यूज़र के रूप में आमंत्रित करें","ist jetzt als Benutzer:in freigeschaltet und kann ein Konto erstellen.":"अब स्वीकृत है और खाता बना सकता/सकती है।","Einladungs-Mail schicken":"आमंत्रण मेल भेजें","Dein Zugang zur TSCHUGGER Crew-App":"TSCHUGGER Crew ऐप में आपकी पहुँच","du bist für die Crew-App von TSCHUGGER Tigerblood freigeschaltet. Dort findest du Drehplan, Dispos, Crewliste, Locations und das Drehbuch.":"अब आपके पास TSCHUGGER Tigerblood Crew ऐप की पहुँच है। इसमें Schedule, Callsheets, Crew सूची, Locations और Script हैं।","«Konto erstellen» mit genau dieser E-Mail-Adresse:":"ठीक इसी ई-मेल पते से “खाता बनाएँ”:","(Gmail-Adresse: einfach «Mit Google anmelden»)":"(Gmail पता: बस “Google से साइन इन करें”)","Bestätigungs-Mail öffnen und auf den Link tippen – bitte auch im Spam-Ordner nachsehen.":"पुष्टि मेल खोलें और लिंक पर टैप करें – कृपया स्पैम फ़ोल्डर भी देखें।","Gespeichert.":"सेव हो गया।","Passwort-Link senden":"पासवर्ड लिंक भेजें","Startpasswort erzeugen":"शुरुआती पासवर्ड बनाएँ","Anzeigen":"दिखाएँ","Keine Berechtigung – bitte die neuen Firestore-Regeln in Firebase veröffentlichen.":"अनुमति नहीं – कृपया Firebase में नए Firestore नियम प्रकाशित करें।","Ohne Bestätigungs-Mail freischalten":"पुष्टि मेल के बिना स्वीकृत करें","{e} ohne Bestätigungs-Mail freischalten? Nur machen, wenn die Adresse sicher dieser Person gehört.":"{e} को पुष्टि मेल के बिना स्वीकृत करें? ऐसा तभी करें जब पता निश्चित रूप से इसी व्यक्ति का हो।","ist freigeschaltet. Die Person meldet sich einfach an – oder tippt auf «Ich habe bestätigt».":"स्वीकृत है। व्यक्ति बस साइन इन करे – या “मैंने पुष्टि कर दी” पर टैप करे।","Benutzerdaten bearbeiten":"यूज़र डेटा संपादित करें","Aktiv":"सक्रिय","Eingeladen":"आमंत्रित","Mit Rolle":"रोल सहित","Aktionen":"कार्रवाइयाँ","Keine Treffer.":"कोई परिणाम नहीं।","Name, E-Mail oder Funktion suchen":"नाम, ई-मेल या भूमिका खोजें","Daten jetzt aktualisieren":"डेटा अभी रीफ़्रेश करें","Vorproduktion (Prep) sehen":"प्री-प्रोडक्शन (Prep) देखें","Drehplan sehen":"Schedule देखें","Callsheet sehen":"Callsheet देखें","Kontakte (Telefon, E-Mail) sehen":"संपर्क (फ़ोन, ई-मेल) देखें","Meine Termine sehen":"मेरे अपॉइंटमेंट देखें","Crewliste sehen":"Crew सूची देखें","Drehbuch (Script) sehen":"Script देखें","Telefon und E-Mail von Personen ausserhalb der Crewliste sehen":"Crew सूची से बाहर के लोगों का फ़ोन और ई-मेल देखें","Zugangsanfragen freischalten":"पहुँच अनुरोध स्वीकृत करें","Berechtigung":"अनुमति","Berechtigungen":"अनुमतियाँ","Keine Berechtigungen":"कोई अनुमति नहीं","Standard wiederherstellen":"डिफ़ॉल्ट बहाल करें","Abbrechen":"रद्द करें","Geschlecht":"लिंग","bitte wählen":"कृपया चुनें","Keine Berechtigung – bitte zuerst die neuen Firestore-Regeln veröffentlichen (Firebase-Konsole → Firestore → Regeln).":"अनुमति नहीं – कृपया पहले नए Firestore नियम प्रकाशित करें (Firebase कंसोल → Firestore → Rules)।","Bitte ausfüllen:":"कृपया भरें:","Profil gespeichert. Geschlecht, Telefon und E-Mail konnten noch nicht gespeichert werden – die Produktion muss die neuen App-Regeln aktivieren.":"प्रोफ़ाइल सेव हो गई। लिंग, फ़ोन और ई-मेल अभी सेव नहीं हो सके – प्रोडक्शन को नए ऐप नियम सक्रिय करने होंगे।","Willkommen bestätigt":"स्वागत की पुष्टि हुई","Willkommen noch nicht bestätigt":"स्वागत की पुष्टि अभी नहीं हुई","Danke – viel Spass mit der App!":"धन्यवाद – ऐप का आनंद लें!","Crewliste: Telefonnummer sehen":"Crew सूची: फ़ोन नंबर देखें","Crewliste: E-Mail sehen":"Crew सूची: ई-मेल देखें","E-Mail-Adressen sehen":"ई-मेल पते देखें","E-Mail-Adressen":"ई-मेल पते","Benutzer:innen ohne Rolle":"बिना रोल वाले यूज़र","Was Personen ohne Rolle sehen. Ausgeschaltet sehen es nur Personen, deren Rolle es erlaubt.":"बिना रोल वाले लोग क्या देखते हैं। बंद होने पर केवल वे लोग देखते हैं जिनका रोल इसकी अनुमति देता है।","Telefonnummern sehen":"फ़ोन नंबर देखें","Telefonnummern":"फ़ोन नंबर","Ausgeschaltet sehen nur Personen mit einer Rolle, die «Telefonnummern sehen» erlaubt, die Nummern in Crewliste und Kontaktkarten.":"बंद होने पर Crew सूची और संपर्क कार्ड में नंबर केवल वे लोग देखते हैं जिनका रोल “फ़ोन नंबर देखें” की अनुमति देता है।","Telefonnummern allen Benutzer:innen ohne Rolle anzeigen":"बिना रोल वाले सभी यूज़र को फ़ोन नंबर दिखाएँ","Prep sehen":"Prep देखें","Drehbuch sehen":"Script देखें","Blocking sehen":"Blocking देखें","Telefon sehen":"फ़ोन देखें","E-Mail sehen":"ई-मेल देखें","Externe Kontakte sehen":"बाहरी संपर्क देखें","Essen sehen":"भोजन देखें","Geburtstage sehen":"जन्मदिन देखें","VCF exportieren":"VCF एक्सपोर्ट करें","Alle Termine sehen":"सभी अपॉइंटमेंट देखें","Benutzer sehen":"यूज़र देखें","Benutzer ändern":"यूज़र बदलें","Benutzer einladen":"यूज़र आमंत्रित करें","Anfragen freischalten":"अनुरोध स्वीकृत करें","Einstellungen ändern":"सेटिंग्स बदलें","Termine":"अपॉइंटमेंट","Benutzer":"यूज़र","App":"ऐप","Online":"ऑनलाइन","gerade aktiv":"अभी सक्रिय","Gerade aktiv":"अभी सक्रिय","Gerade ist niemand aktiv.":"अभी कोई सक्रिय नहीं है।","aktiv vor {n} Min.":"{n} मिनट पहले सक्रिय","aktiv vor {n} Std.":"{n} घंटे पहले सक्रिय","zuletzt online":"आखिरी बार ऑनलाइन","gestern":"कल","vor {n} Min.":"{n} मिनट पहले","noch nie online":"कभी ऑनलाइन नहीं","Zuletzt online":"आखिरी बार ऑनलाइन","zuletzt aktiv":"आखिरी बार सक्रिय","Standard":"डिफ़ॉल्ट","Gilt für alle ohne andere Rolle, auch für neue Benutzer:innen.":"किसी अन्य रोल के बिना सभी पर लागू, नए यूज़र पर भी।","Für die App-Verwaltung fehlt die Berechtigung «Einstellungen ändern».":"ऐप प्रबंधन के लिए “सेटिंग्स बदलें” अनुमति ज़रूरी है।","keine":"कोई नहीं","Anmeldung":"साइन इन","Ausgeschaltet verschwindet «Mit Google anmelden» auf der Anmeldeseite. Wer schon mit Google angemeldet ist, bleibt angemeldet.":"बंद होने पर साइन-इन पेज से “Google से साइन इन करें” हट जाता है। जो पहले से Google से साइन इन हैं, वे साइन इन रहते हैं।","Mit Google anmelden anbieten":"Google से साइन इन का विकल्प दें","ohne Sonderwünsche":"कोई विशेष अनुरोध नहीं","mit Sonderwünschen":"विशेष अनुरोधों के साथ","Weitere Allergien":"अन्य एलर्जी","Keine Rolle (eingeschränkt)":"कोई रोल नहीं (सीमित)","Wird neuen Benutzer:innen automatisch zugewiesen.":"नए यूज़र को अपने-आप दिया जाता है।","Personen ohne Rolle sehen weder Drehplan, Drehbuch noch Blocking. Hier kannst du ihnen zusätzlich freigeben:":"बिना रोल वाले लोग न Schedule, न Script, न Blocking देखते हैं। आप इन्हें अतिरिक्त अनुमति दे सकते हैं:","Dokumente":"दस्तावेज़","Owner":"Owner","Telefon":"फ़ोन","Sortieren":"क्रमबद्ध करें","Abteilung":"विभाग","Status":"स्थिति","Neueste zuerst":"नवीनतम पहले","Rollen":"रोल","Benutzer:in":"यूज़र","Neue Rolle":"नया रोल","Rolle erstellen":"रोल बनाएँ","Rolle löschen":"रोल हटाएँ","Rolle gespeichert.":"रोल सेव हो गया।","Rolle gelöscht.":"रोल हटा दिया गया।","Name der Rolle":"रोल का नाम","Name der Rolle, z. B. Catering":"रोल का नाम, जैसे Catering","Personen":"लोग","Benutzerdaten sehen":"यूज़र डेटा देखें","Benutzerdaten ändern":"यूज़र डेटा बदलें","Benutzer:innen einladen und Anfragen freischalten":"यूज़र आमंत्रित करें और अनुरोध स्वीकृत करें","Essen und Allergien in der Crew sehen":"Crew सूची में भोजन और एलर्जी देखें","Geburtstage in der Crew sehen":"Crew सूची में जन्मदिन देखें","Alle Kontakte als VCF exportieren":"सभी संपर्क VCF के रूप में एक्सपोर्ट करें","Termine aller Personen ansehen":"सभी के अपॉइंटमेंट देखें","Einstellungen der App ändern":"ऐप सेटिंग्स बदलें","Alles, auch Rollen, Admins, Sperren und Backup":"सब कुछ, रोल, Admins, ब्लॉकिंग और बैकअप सहित","Alle Berechtigungen ausser «Einstellungen ändern»":"“ऐप सेटिंग्स बदलें” को छोड़कर सभी अनुमतियाँ","Eine Rolle bündelt Berechtigungen. Zuweisen kannst du sie in der Benutzerverwaltung bei der Person unter «Rolle». Ohne Rolle sieht eine Person alle Drehdaten, die Crewliste, das Drehbuch und das Blocking, aber keine Verwaltung. Mit Rolle sieht sie nur die Bereiche, die die Rolle erlaubt.":"एक रोल कई अनुमतियों को एक साथ रखता है। इसे यूज़र प्रबंधन में “रोल” के तहत दें। बिना रोल के व्यक्ति सारा शूटिंग डेटा, Crew सूची, Script और Blocking देखता है, पर कोई प्रबंधन नहीं। रोल के साथ केवल वही जो रोल अनुमति देता है।","Rolle «{r}» löschen? Personen mit dieser Rolle verlieren ihre Berechtigungen.":"रोल “{r}” हटाएँ? इस रोल वाले लोग इसकी अनुमतियाँ खो देंगे।","Benutzerverwaltung":"यूज़र प्रबंधन","Einstellungen":"सेटिंग्स","Kontoinfos":"खाता जानकारी","Startpasswort":"शुरुआती पासवर्ड","Für {e} ein Konto mit Startpasswort anlegen? Beim ersten Anmelden muss die Person ein eigenes Passwort festlegen.":"{e} के लिए शुरुआती पासवर्ड के साथ खाता बनाएँ? पहली बार साइन इन पर व्यक्ति को अपना पासवर्ड सेट करना होगा।","hat schon ein Konto – dafür «Passwort-Link senden» verwenden.":"का पहले से खाता है – “पासवर्ड लिंक भेजें” का उपयोग करें।","dein Konto für die Crew-App von TSCHUGGER Tigerblood ist bereit:":"TSCHUGGER Tigerblood Crew ऐप के लिए आपका खाता तैयार है:","Beim ersten Anmelden legst du ein eigenes Passwort fest.":"पहली बार साइन इन पर आप अपना पासवर्ड सेट करेंगे।","Gilt nur für die erste Anmeldung. Danach muss die Person ein eigenes Passwort festlegen. Das Startpasswort wird nirgends gespeichert – jetzt weitergeben.":"केवल पहली बार साइन इन के लिए मान्य। फिर व्यक्ति को अपना पासवर्ड सेट करना होगा। शुरुआती पासवर्ड कहीं सेव नहीं होता – इसे अभी दे दें।","Per Mail schicken":"मेल से भेजें","Bitte lege jetzt dein eigenes Passwort fest.":"कृपया अब अपना पासवर्ड सेट करें।","Du hast dich mit einem Startpasswort angemeldet. Es gilt nur einmal.":"आपने शुरुआती पासवर्ड से साइन इन किया है। यह केवल एक बार काम करता है।","Neues Passwort (mind. 8 Zeichen)":"नया पासवर्ड (कम से कम 8 अक्षर)","Neues Passwort wiederholen":"नया पासवर्ड दोहराएँ","Passwort speichern":"पासवर्ड सेव करें","Passwort gespeichert.":"पासवर्ड सेव हो गया।","{e} einen Link schicken, mit dem die Person ein neues Passwort festlegt?":"{e} को नया पासवर्ड सेट करने का लिंक भेजें?","Link für ein neues Passwort gesendet an":"नए पासवर्ड का लिंक भेजा गया:","Bearbeiten":"संपादित करें","Funktion":"भूमिका","Die E-Mail-Adresse kann nicht geändert werden – dafür die Person entfernen und mit der neuen Adresse einladen.":"ई-मेल पता बदला नहीं जा सकता – व्यक्ति को हटाएँ और नए पते को आमंत्रित करें।","Zugangsanfragen":"पहुँच अनुरोध","Diese Personen sind nicht auf der Liste und bitten um Zugang. «Freischalten» lädt sie ein; sie tippen danach auf «Aktualisieren».":"ये लोग सूची में नहीं हैं और पहुँच माँग रहे हैं। “स्वीकृत करें” उन्हें आमंत्रित करता है; फिर वे “रीफ़्रेश” पर टैप करते हैं।","Freischalten":"स्वीकृत करें","Ablehnen":"अस्वीकार करें","Freigeschaltet:":"स्वीकृत:","Anfrage abgelehnt.":"अनुरोध अस्वीकार किया गया।","offene Zugangsanfrage – siehe App-Verwaltung.":"खुला पहुँच अनुरोध – ऐप प्रबंधन देखें।","offene Zugangsanfragen – siehe App-Verwaltung.":"खुले पहुँच अनुरोध – ऐप प्रबंधन देखें।","E-Mail mit Anmelde-Link gesendet an":"साइन-इन लिंक वाला ई-मेल भेजा गया:","Dein Zugang zur TSCHUGGER Crew-App ist freigeschaltet":"TSCHUGGER Crew ऐप में आपकी पहुँच स्वीकृत हो गई है","Hallo":"नमस्ते","dein Zugang zur Crew-App von TSCHUGGER Tigerblood ist freigeschaltet. Melde dich hier mit dieser E-Mail-Adresse an:":"TSCHUGGER Tigerblood Crew ऐप में आपकी पहुँच स्वीकृत हो गई है। इस ई-मेल पते से यहाँ साइन इन करें:","Bis bald am Set!":"सेट पर मिलते हैं!","Bitte bestätige deine E-Mail-Adresse:":"कृपया अपना ई-मेल पता पुष्टि करें:","Bestätigungs-Mail konnte nicht gesendet werden:":"पुष्टि ई-मेल नहीं भेजा जा सका:","Kein Zugang":"पहुँच नहीं","Deine Adresse ist (noch) nicht für die Crew-App freigeschaltet. Bitte melde dich bei der Produktion.":"आपका पता (अभी) Crew ऐप के लिए सक्षम नहीं है। कृपया प्रोडक्शन से संपर्क करें।","Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion.":"आपकी पहुँच अवरुद्ध कर दी गई है। कृपया प्रोडक्शन से संपर्क करें।","Abmelden":"साइन आउट","Darstellung":"रूप-रंग","Dunkel":"डार्क","Hell (gut lesbar)":"लाइट (पढ़ने में आसान)","Eingeschaltet erscheint bei jeder Szene der Knopf «Script», der die Szene im Drehbuch öffnet.":"चालू होने पर हर सीन में “Script” बटन दिखता है, जो सीन को Script में खोलता है।","Drehbuch anzeigen":"Script दिखाएँ","Backup":"बैकअप","Sichert Benutzer:innen, Einladungen, Administrator:innen, Einstellungen der App und Geburtstage als Datei. Die Drehdaten selbst kommen aus der Dropbox und brauchen kein Backup.":"उपयोगकर्ता, आमंत्रण, Admin, ऐप सेटिंग्स और जन्मदिन एक फ़ाइल में सहेजता है। शूटिंग डेटा Dropbox से आता है, उसका बैकअप ज़रूरी नहीं।","Letztes Backup auf diesem Gerät":"इस डिवाइस पर पिछला बैकअप","Backup herunterladen":"बैकअप डाउनलोड करें","Backup wiederherstellen":"बैकअप बहाल करें","Beim Wiederherstellen werden die Einträge aus der Datei ergänzt oder überschrieben. Nichts wird gelöscht.":"बहाल करने पर फ़ाइल की प्रविष्टियाँ जोड़ी या अधिलेखित की जाती हैं। कुछ भी हटाया नहीं जाता।","Backup gespeichert":"बैकअप सहेजा गया","Einladungen":"आमंत्रण","Datei ist zu gross.":"फ़ाइल बहुत बड़ी है।","Datei ist kein gültiges Backup.":"फ़ाइल मान्य बैकअप नहीं है।","Backup vom {d} wiederherstellen? Vorhandene Einträge werden ergänzt oder überschrieben.":"{d} का बैकअप बहाल करें? मौजूदा प्रविष्टियाँ जोड़ी या अधिलेखित होंगी।","Wiederhergestellt":"बहाल किया गया","fehlgeschlagen":"विफल","Bereiche":"अनुभाग","Nur die gewählten Bereiche erscheinen unten in der App. Mindestens einer.":"केवल चुने गए अनुभाग ऐप के नीचे दिखते हैं। कम से कम एक।","Bitte mindestens einen Bereich wählen.":"कृपया कम से कम एक अनुभाग चुनें।","Die Daten werden jede Stunde automatisch aus der Dropbox geladen.":"डेटा हर घंटे Dropbox से अपने-आप लोड होता है।","Bitte zuerst anmelden.":"कृपया पहले साइन इन करें।","Eingeschaltet werden Drehplan, Drehbuch, Crewliste, Callsheets und Motivliste jede Stunde automatisch neu geladen (nur gelesen).":"चालू होने पर Schedule, Script, Crew सूची, Callsheets और Locations सूची हर घंटे अपने-आप फिर से लोड होती हैं (केवल पढ़ने हेतु)।","Daten aus der Dropbox automatisch laden":"Dropbox से डेटा अपने-आप लोड करें","Nach oben":"ऊपर ले जाएँ","Nach unten":"नीचे ले जाएँ","Reihenfolge mit ▲ ▼ ändern.":"▲ ▼ से क्रम बदलें।","Mein Konto":"मेरा खाता","Angemeldet als":"इस रूप में साइन इन:","Passwort ändern":"पासवर्ड बदलें","E-Mail-Adresse ändern":"ई-मेल पता बदलें","Speichern":"सहेजें","Passwort geändert.":"पासवर्ड बदल दिया गया।","Aktuelles Passwort falsch.":"मौजूदा पासवर्ड ग़लत है।","Bestätigungslink an die neue Adresse gesendet. Die Änderung gilt, sobald du ihn antippst.":"पुष्टि लिंक नए पते पर भेजा गया। उस पर टैप करते ही बदलाव लागू होगा।","Diese Adresse wird schon verwendet.":"यह पता पहले से उपयोग में है।","App-Verwaltung":"ऐप प्रबंधन","Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen.":"साइन-इन उपलब्ध नहीं। कृपया इंटरनेट कनेक्शन जाँचें।","Bitte warten …":"कृपया प्रतीक्षा करें …","Mit Google anmelden":"Google से साइन इन करें","oder":"या","Du bist mit Google angemeldet. Passwort und Adresse verwaltest du in deinem Google-Konto.":"आप Google से साइन इन हैं। पासवर्ड और पता अपने Google खाते में प्रबंधित करें।","Google-Anmeldung abgebrochen.":"Google साइन-इन रद्द किया गया।","Offline – du siehst den zuletzt geladenen Stand.":"ऑफ़लाइन – आप अंतिम लोड किया गया डेटा देख रहे हैं।","Vorname":"पहला नाम","Nachname":"उपनाम","Sprache der App":"ऐप की भाषा","Geburtsdatum (optional)":"जन्मतिथि (वैकल्पिक)","Profil":"प्रोफ़ाइल","Profil gespeichert.":"प्रोफ़ाइल सहेजी गई।","Bitte ergänze dein Profil.":"कृपया अपनी प्रोफ़ाइल पूरी करें।","Link zum Zurücksetzen gesendet an":"रीसेट लिंक भेजा गया:","Schau auch im Spam-Ordner nach.":"स्पैम फ़ोल्डर भी देखें।","Willkommen!":"स्वागत है!","Bitte fülle vor dem ersten Start dein Profil aus.":"शुरू करने से पहले कृपया अपनी प्रोफ़ाइल भरें।","Name":"नाम","Aus der Crewliste übernommen.":"Crew सूची से लिया गया।","Essen":"भोजन","aktiv":"सक्रिय","Noch kein Konto":"अभी कोई खाता नहीं","keine Angaben":"जानकारी नहीं दी","Alle Kontakte als VCF":"सभी संपर्क VCF के रूप में","Kontakte als VCF gespeichert.":"संपर्क VCF के रूप में सहेजे गए।","Besitzer:in":"Owner","Admin":"Admin","Liste der Benutzer:innen konnte nicht geladen werden:":"उपयोगकर्ता सूची लोड नहीं हो सकी:","Lade Benutzer:innen …":"उपयोगकर्ता लोड हो रहे हैं …","aktiv_1":"सक्रिय","gesperrt":"अवरुद्ध","eingeladen":"आमंत्रित","Administrator:innen":"Admin","Administrator:innen können Leute einladen und sehen in der Crew Essen und Geburtstage. Sperren und Entfernen kannst nur du. Admins und andere Rollen weist du unten bei der Person unter «Rolle» zu.":"Admin लोगों को आमंत्रित कर सकते हैं और Crew सूची में भोजन व जन्मदिन देख सकते हैं। अवरुद्ध करना और हटाना केवल आप कर सकते हैं। Admin और अन्य भूमिकाएँ नीचे व्यक्ति के “भूमिका” में दें।","Entfernen":"हटाएँ","Nur eingeladene Adressen können ein Konto erstellen (E-Mail/Passwort oder Google). Gesperrte oder entfernte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.":"केवल आमंत्रित पते ही खाता बना सकते हैं (ई-मेल/पासवर्ड या Google)। अवरुद्ध या हटाए गए लोगों की पहुँच तुरंत समाप्त हो जाती है। हर व्यक्ति अपना पासवर्ड और ई-मेल पता स्वयं प्रबंधित करता है।","E-Mail-Adresse":"ई-मेल पता","Name (optional)":"नाम (वैकल्पिक)","Einladen":"आमंत्रित करें","Alle {n} Adressen aus der Crewliste einladen":"Crew सूची के सभी {n} पते आमंत्रित करें","Benutzer:innen":"उपयोगकर्ता","noch nicht registriert":"अभी पंजीकृत नहीं","Benutzer:innen suchen":"उपयोगकर्ता खोजें","Einladungsmail":"आमंत्रण ई-मेल","Admin entfernen":"Admin हटाएँ","Zum Admin machen":"Admin बनाएँ","Sperren":"अवरुद्ध करें","Entsperren":"अनब्लॉक करें","Einladung löschen":"आमंत्रण हटाएँ","ist jetzt Admin.":"अब Admin है।","Fehler:":"त्रुटि:","eingeladen.":"आमंत्रित।","{n} Adressen aus der Crewliste einladen?":"Crew सूची से {n} पते आमंत्रित करें?","{n} Adressen eingeladen.":"{n} पते आमंत्रित किए गए।","Die Besitzerin oder der Besitzer kann nicht gesperrt oder entfernt werden.":"Owner को अवरुद्ध या हटाया नहीं जा सकता।","Gesperrt.":"अवरुद्ध।","Entsperrt.":"अनब्लॉक किया गया।","{e} entfernen? Die Person kommt danach nicht mehr in die App.":"{e} को हटाएँ? इसके बाद यह व्यक्ति ऐप में नहीं आ पाएगा।","Entfernt.":"हटाया गया।","{e} die Admin-Rechte entziehen?":"{e} से Admin अधिकार हटाएँ?","Admin-Rechte entzogen.":"Admin अधिकार हटाए गए।","Einladung gelöscht.":"आमंत्रण हटाया गया।","Daten der Benutzer:innen nicht lesbar":"उपयोगकर्ता डेटा पढ़ा नहीं जा सका","Firestore-Regeln prüfen.":"Firestore नियम जाँचें।","Crew-App":"Crew ऐप","MAIL_BODY":"नमस्ते{n}\n\nअब आपको TSCHUGGER Tigerblood Crew ऐप की पहुँच मिल गई है:\n{site}\n\nपहली बार “पहली बार यहाँ? खाता बनाएँ” पर टैप करें, इस पते ({e}) के साथ अपना पासवर्ड चुनें और सत्यापन ई-मेल की पुष्टि करें।\n\nValais में मिलते हैं!","Sprachen der App":"ऐप की भाषाएँ","Nur diese Sprachen stehen in der App zur Auswahl. Mindestens eine.":"ऐप में केवल ये भाषाएँ उपलब्ध हैं। कम से कम एक।","Bitte mindestens eine Sprache wählen.":"कृपया कम से कम एक भाषा चुनें।","Sprachen gespeichert.":"भाषाएँ सहेजी गईं।","Einstellungen der App":"ऐप सेटिंग्स","Sprachen":"भाषाएँ","Ausgeschaltet zeigt die App nur die 1st Unit, ohne die Knöpfe 1st/2nd.":"बंद होने पर ऐप केवल 1st Unit दिखाता है, 1st/2nd बटनों के बिना।","Geburtstagsliste allen anzeigen":"जन्मदिन सूची सभी को दिखाएँ","Eingeschaltet sehen alle Benutzer:innen in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).":"चालू होने पर सभी उपयोगकर्ता Crew टैब में शूट के दौरान की जन्मदिन सूची देखते हैं (केवल दिन और महीना, वर्ष नहीं)।","3rd Unit anzeigen":"3rd Unit दिखाएँ","Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.":"बंद की गई Units Schedule, Callsheet और Locations से हट जाती हैं। केवल 1st Unit चालू हो तो Unit बटन नहीं दिखते।","2nd Unit anzeigen":"2nd Unit दिखाएँ","Einstellungen gespeichert.":"सेटिंग्स सहेजी गईं।","Benutzer:innen einladen":"उपयोगकर्ता आमंत्रित करें","Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.":"Locations वाली Google Sheet का लिंक (कॉलम SCRIPT NAME, ADRESSE, SCENES, LINK; “लिंक वाला कोई भी देख सकता है”)। अगले घंटेवार अपडेट में लागू होगा। खाली = मौजूदा सूची।","Bitte einen Google-Sheets-Link eingeben.":"कृपया Google Sheets लिंक दर्ज करें।","Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.":"Locations में “Map” बटन के लिए मैप का लिंक (जैसे Google My Maps)। खाली = डिफ़ॉल्ट मैप।","Bitte einen Link mit https:// eingeben.":"कृपया https:// से शुरू होने वाला लिंक दर्ज करें।","Kontostatus":"खाते की स्थिति","Konto aktiv":"खाता सक्रिय","Gesperrt":"अवरुद्ध","Eingeladen, noch kein Konto":"आमंत्रित, अभी कोई खाता नहीं","Geburtstag":"जन्मदिन","Geburtstagskalender":"जन्मदिन कैलेंडर","Geburtstage":"जन्मदिन","Geburtstage während des Drehs":"शूट के दौरान जन्मदिन","Keine Geburtstage während des Drehs.":"शूट के दौरान कोई जन्मदिन नहीं।","Ich esse alles":"मैं सब कुछ खाता/खाती हूँ","Vegetarisch":"शाकाहारी","Vegan":"वीगन","Keine Milchprodukte":"कोई डेयरी नहीं","Pescetarisch":"पेस्केटेरियन","Kein Schweinefleisch":"सूअर का मांस नहीं","Halal":"हलाल","Koscher":"कोशर","Keine Milchprodukte / laktosefrei":"कोई डेयरी नहीं / लैक्टोज़-मुक्त","Glutenfrei":"ग्लूटेन-मुक्त","Ohne Nüsse":"मेवे नहीं","Ohne Erdnüsse":"मूँगफली नहीं","Ohne Meeresfrüchte":"समुद्री भोजन नहीं","Ohne Eier":"अंडे नहीं","Ernährung":"आहार","Verträglichkeiten":"असहिष्णुताएँ","Geburtsdatum":"जन्मतिथि","Geschlecht (optional)":"लिंग (वैकल्पिक)","Männlich":"पुरुष","Weiblich":"महिला","Divers":"अन्य","Weitere Allergien (optional)":"अन्य एलर्जी (वैकल्पिक)","Allergien / Unverträglichkeiten (optional)":"एलर्जी / असहिष्णुताएँ (वैकल्पिक)","Nur für die Produktion sichtbar.":"केवल प्रोडक्शन को दिखाई देता है।","Allergien":"एलर्जी","Keine Rolle":"कोई भूमिका नहीं","Tour angefangen":"टूर शुरू किया","Übersicht":"सारांश","Namen und Details":"नाम और विवरण","Alle aktiven Benutzer:innen der App, die am Set verpflegt werden.":"ऐप के सभी सक्रिय उपयोगकर्ता जिन्हें सेट पर भोजन मिलता है।","Alle Sonderwünsche":"सभी विशेष अनुरोध","Tage wählen":"दिन चुनें","Wische durch die Tage: PREP, OFF, TRAVEL und die Drehtage D01, D02 … Heute ist hervorgehoben.":"दिनों को स्वाइप करें: PREP, OFF, TRAVEL और शूटिंग दिन D01, D02 … आज का दिन हाइलाइट है।","Auch im Callsheet wählst du oben den Tag und filterst nach Unit.":"Callsheet में भी ऊपर दिन चुनें और Unit के अनुसार फ़िल्टर करें।","Optionen":"विकल्प","«Szenen» klappt alle Szenen auf oder zu; daneben blendest du Info und Adresse ein und filterst nach Unit.":"«दृश्य» सभी दृश्य खोलता या बंद करता है; पास में Info और पता दिखाएँ और Unit के अनुसार फ़िल्टर करें।","Suche nach Motiv, Adresse oder Szene.":"लोकेशन, पता या दृश्य खोजें।","Crew durchsuchen":"Crew में खोजें","Suche nach Name, Funktion oder Abteilung. Mit «vCard» speicherst du einen Kontakt direkt im Telefon.":"नाम, भूमिका या विभाग से खोजें। «vCard» से संपर्क सीधे फ़ोन में सेव करें।","Zusatzinfos":"अतिरिक्त जानकारी","Je nach Berechtigung: Essen, Geburtstage, Kontoinfos und alle Kontakte als VCF.":"अनुमति के अनुसार: भोजन, जन्मदिन, खाता जानकारी और सभी संपर्क VCF के रूप में।","Blende Infobox, Drehtag & Zeit, englische Szenenbezeichnung, Cast, Adresse und Blocking ein oder aus.":"इन्फ़ोबॉक्स, शूट दिन व समय, अंग्रेज़ी दृश्य शीर्षक, Cast, पता और Blocking दिखाएँ या छिपाएँ।","Suche im Drehbuch gezielt nach Rolle, Szene, Drehtag, Person, Motiv oder Text.":"स्क्रिप्ट में भूमिका, दृश्य, शूट दिन, व्यक्ति, लोकेशन या टेक्स्ट से खोजें।","Alle Essenswünsche, Unverträglichkeiten und Allergien der Crew auf einen Blick.":"Crew की सभी भोजन पसंद, असहिष्णुताएँ और एलर्जी एक नज़र में।","Push-Glocke":"सूचना घंटी","Mit der Glocke schaltest du die Erinnerung für einzelne Termine aus oder ein.":"घंटी से किसी एक अपॉइंटमेंट का रिमाइंडर चालू या बंद करें।","Hier stellst du ein, ob, wann und für welche Termine du erinnert wirst.":"यहाँ तय करें कि रिमाइंडर मिले या नहीं, कब और किन अपॉइंटमेंट के लिए।","Termin in den Kalender":"कैलेंडर में जोड़ें","Mit dem Kalender-Knopf übernimmst du einen Termin direkt in deinen Kalender (Handy oder Computer).":"कैलेंडर बटन से अपॉइंटमेंट सीधे अपने कैलेंडर (फ़ोन या कंप्यूटर) में जोड़ें।","Der Brief-Knopf öffnet eine E-Mail an alle Teilnehmenden dieses Termins – praktisch für kurzfristige Infos.":"लिफ़ाफ़ा बटन इस अपॉइंटमेंट के सभी प्रतिभागियों को ई-मेल खोलता है – अचानक की सूचना के लिए उपयोगी।","Die Crewliste nach Abteilungen.":"विभागों के अनुसार Crew सूची।","Mit Telefon und E-Mail – ein Tipp genügt zum Anrufen oder Schreiben.":"फ़ोन और ई-मेल के साथ – कॉल या लिखने के लिए एक टैप काफ़ी है।","Kalender-Export":"कैलेंडर एक्सपोर्ट","«Alle in den Kalender» übernimmt alle deine Termine auf einmal; mit dem Kalender-Knopf bei jedem Termin einzeln.":"«सब कैलेंडर में» आपके सभी अपॉइंटमेंट एक साथ जोड़ता है; हर अपॉइंटमेंट के कैलेंडर बटन से अलग-अलग।","Deine Verwaltung:":"आपका प्रबंधन:","Schedule":"शेड्यूल","Script":"स्क्रिप्ट","Info":"जानकारी","Catering":"कैटरिंग","Blocking":"ब्लॉकिंग","PREP":"तैयारी","1st / 2nd Unit":"1st / 2nd Unit","Production":"प्रोडक्शन","Accounting":"लेखा","Writers":"लेखक","Casting CH":"कास्टिंग CH","Directing / AD":"निर्देशन / AD","Locations / Unit management":"लोकेशन / यूनिट प्रबंधन","Camera":"कैमरा","Lighting / grip":"लाइटिंग / ग्रिप","Sound":"साउंड","Art department":"आर्ट विभाग","Costume":"कॉस्ट्यूम","Make-up":"मेकअप","Stunt / SFX / VFX":"स्टंट / SFX / VFX","Post-production":"पोस्ट-प्रोडक्शन","Rentals":"किराया","Emergency":"आपातकाल","Hotel":"होटल","Base":"बेस","Food":"भोजन","Shopping":"खरीदारी","Pharmacy":"फ़ार्मेसी","Laundry":"लॉन्ड्री","ATMs & gas stations":"ATM और पेट्रोल पंप","Getting around":"आवागमन","Prep":"तैयारी (Prep)","Weekly Schedule":"साप्ताहिक शेड्यूल"};for(const k in HI){if(!I18N[k])I18N[k]={};I18N[k].hi=HI[k]}}
/* a text field keeps the focus in Safari when a button elsewhere is tapped; then the page would not re-render
   (render() protects forms someone is typing in) – so leave the field as soon as something outside its form is used */
document.addEventListener("click",e=>{const ae=document.activeElement;if(ae&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&ae.form&&!ae.form.contains(e.target)&&e.target.closest("button,[role=tab],a,summary,label"))try{ae.blur()}catch(_){}},true);
document.addEventListener("change",e=>{if(!e.target.matches||!e.target.matches("select"))return;const ae=document.activeElement;if(ae&&ae!==e.target&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&ae.form&&!ae.form.contains(e.target))try{ae.blur()}catch(_){}},true);
/* main topics (bottom bar): English names in every language except Hindi */
function hiTabs(){document.querySelectorAll("nav.tabs button[data-tab] .lbl").forEach(l=>{if(!l.dataset.orig)l.dataset.orig=l.textContent.trim();const o=l.dataset.orig;l.textContent=LANG==="hi"&&I18N[o]&&I18N[o].hi?I18N[o].hi:o})}
{const _r=render;render=function(){const x=_r.apply(this,arguments);try{hiTabs()}catch(_){}return x}}
