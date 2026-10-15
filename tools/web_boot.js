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
 "Kein Zugang":{it:"Nessun accesso",fr:"Pas d’accès",en:"No access"},
 "Deine Adresse ist (noch) nicht für die Crew-App freigeschaltet. Bitte melde dich bei der Produktion.":{it:"Il tuo indirizzo non è (ancora) abilitato per l’app. Contatta la produzione.",fr:"Ton adresse n’est pas (encore) autorisée pour l’app. Contacte la production.",en:"Your address is not (yet) enabled for the crew app. Please contact the production."},
 "Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion.":{it:"Il tuo accesso è stato bloccato. Contatta la produzione.",fr:"Ton accès a été bloqué. Contacte la production.",en:"Your access has been blocked. Please contact the production."},
 "Abmelden":{it:"Esci",fr:"Se déconnecter",en:"Sign out"},
 "Mein Konto":{it:"Il mio account",fr:"Mon compte",en:"My account"},
 "Angemeldet als":{it:"Connesso come",fr:"Connecté·e en tant que",en:"Signed in as"},
 "Passwort ändern":{it:"Cambia password",fr:"Changer le mot de passe",en:"Change password"},
 "E-Mail-Adresse ändern":{it:"Cambia indirizzo e-mail",fr:"Changer l’adresse e-mail",en:"Change email address"},
 "Speichern":{it:"Salva",fr:"Enregistrer",en:"Save"},
 "Schliessen":{it:"Chiudi",fr:"Fermer",en:"Close"},
 "Passwort geändert.":{it:"Password modificata.",fr:"Mot de passe modifié.",en:"Password changed."},
 "Aktuelles Passwort falsch.":{it:"Password attuale errata.",fr:"Mot de passe actuel incorrect.",en:"Current password is wrong."},
 "Bestätigungslink an die neue Adresse gesendet. Die Änderung gilt, sobald du ihn antippst.":{it:"Link di conferma inviato al nuovo indirizzo. La modifica vale appena lo tocchi.",fr:"Lien de confirmation envoyé à la nouvelle adresse. Le changement s’applique dès que tu le touches.",en:"Confirmation link sent to the new address. The change applies once you tap it."},
 "Diese Adresse wird schon verwendet.":{it:"Questo indirizzo è già in uso.",fr:"Cette adresse est déjà utilisée.",en:"This address is already in use."},
 "Benutzer verwalten":{it:"Gestisci utenti",fr:"Gérer les utilisateurs",en:"Manage users"},
 "Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen.":{it:"Accesso non raggiungibile. Controlla la connessione internet.",fr:"Connexion impossible. Vérifie la connexion internet.",en:"Sign-in unavailable. Please check your internet connection."},
 "Bitte warten …":{it:"Attendere …",fr:"Un instant …",en:"Please wait …"},
 "Mit Google anmelden":{it:"Accedi con Google",fr:"Se connecter avec Google",en:"Sign in with Google"},
 "oder":{it:"oppure",fr:"ou",en:"or"},
 "Du bist mit Google angemeldet. Passwort und Adresse verwaltest du in deinem Google-Konto.":{it:"Sei connesso con Google. Password e indirizzo si gestiscono nel tuo account Google.",fr:"Tu es connecté·e avec Google. Mot de passe et adresse se gèrent dans ton compte Google.",en:"You are signed in with Google. Manage password and address in your Google account."},
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
 "Willkommen!":{fr:"Bienvenue !",it:"Benvenuto/a!",en:"Welcome!"},
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
 "Haupt-Admin":{fr:"Admin principal",it:"Admin principale",en:"Main admin"},
 "Admin":{fr:"Admin",it:"Admin",en:"Admin"},
 "Benutzerliste konnte nicht geladen werden:":{fr:"Impossible de charger la liste des utilisateurs :",it:"Impossibile caricare l’elenco utenti:",en:"Could not load the user list:"},
 "Lade Benutzer …":{fr:"Chargement des utilisateurs …",it:"Caricamento utenti …",en:"Loading users …"},
 "aktiv_1":{fr:"actif",it:"attivo",en:"active"},
 "gesperrt":{fr:"bloqué",it:"bloccato",en:"blocked"},
 "eingeladen":{fr:"invité",it:"invitato",en:"invited"},
 "Administratoren":{fr:"Administrateurs",it:"Amministratori",en:"Administrators"},
 "Administratoren können Leute einladen und sehen in der Crew Essen und Geburtstage. Sperren und Entfernen kannst nur du. Admins ernennst du unten bei der Person mit «Zum Admin machen».":{fr:"Les administrateurs peuvent inviter des personnes et voient les repas et anniversaires dans l’équipe. Toi seul peux bloquer et supprimer. Tu nommes des admins plus bas avec « Nommer admin ».",it:"Gli amministratori possono invitare persone e vedono pasti e compleanni nella crew. Solo tu puoi bloccare e rimuovere. Nomini gli admin più sotto con «Rendi admin».",en:"Administrators can invite people and see food and birthdays in the crew list. Only you can block and remove. Appoint admins below with “Make admin”."},
 "Entfernen":{fr:"Supprimer",it:"Rimuovi",en:"Remove"},
 "Nur eingeladene Adressen können ein Konto erstellen (E-Mail/Passwort oder Google). Gesperrte oder entfernte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.":{fr:"Seules les adresses invitées peuvent créer un compte (e-mail/mot de passe ou Google). Les personnes bloquées ou supprimées perdent immédiatement l’accès. Chacun gère lui-même son mot de passe et son adresse e-mail.",it:"Solo gli indirizzi invitati possono creare un account (e-mail/password o Google). Le persone bloccate o rimosse perdono subito l’accesso. Ognuno gestisce da sé password e indirizzo e-mail.",en:"Only invited addresses can create an account (email/password or Google). Blocked or removed people lose access immediately. Everyone manages their own password and email address."},
 "E-Mail-Adresse":{fr:"Adresse e-mail",it:"Indirizzo e-mail",en:"Email address"},
 "Name (optional)":{fr:"Nom (facultatif)",it:"Nome (facoltativo)",en:"Name (optional)"},
 "Einladen":{fr:"Inviter",it:"Invita",en:"Invite"},
 "Alle {n} Adressen aus der Crewliste einladen":{fr:"Inviter les {n} adresses de la liste de l’équipe",it:"Invita tutti i {n} indirizzi della lista crew",en:"Invite all {n} addresses from the crew list"},
 "Benutzer":{fr:"utilisateurs",it:"utenti",en:"users"},
 "noch nicht registriert":{fr:"pas encore inscrits",it:"non ancora registrati",en:"not yet registered"},
 "Benutzer suchen":{fr:"Rechercher un utilisateur",it:"Cerca utente",en:"Search users"},
 "Einladungsmail":{fr:"E-mail d’invitation",it:"E-mail d’invito",en:"Invitation email"},
 "Admin entfernen":{fr:"Retirer admin",it:"Rimuovi admin",en:"Remove admin"},
 "Zum Admin machen":{fr:"Nommer admin",it:"Rendi admin",en:"Make admin"},
 "Sperren":{fr:"Bloquer",it:"Blocca",en:"Block"},
 "Entsperren":{fr:"Débloquer",it:"Sblocca",en:"Unblock"},
 "Einladung löschen":{fr:"Supprimer l’invitation",it:"Elimina invito",en:"Delete invitation"},
 "ist jetzt Admin.":{fr:"est maintenant admin.",it:"ora è admin.",en:"is now admin."},
 "Fehler:":{fr:"Erreur :",it:"Errore:",en:"Error:"},
 "eingeladen.":{fr:"invité·e.",it:"invitato/a.",en:"invited."},
 "{n} Adressen aus der Crewliste einladen?":{fr:"Inviter {n} adresses de la liste de l’équipe ?",it:"Invitare {n} indirizzi dalla lista crew?",en:"Invite {n} addresses from the crew list?"},
 "{n} Adressen eingeladen.":{fr:"{n} adresses invitées.",it:"{n} indirizzi invitati.",en:"{n} addresses invited."},
 "Der Haupt-Admin kann nicht gesperrt oder entfernt werden.":{fr:"L’admin principal ne peut être ni bloqué ni supprimé.",it:"L’admin principale non può essere bloccato né rimosso.",en:"The main admin cannot be blocked or removed."},
 "Gesperrt.":{fr:"Bloqué.",it:"Bloccato.",en:"Blocked."},
 "Entsperrt.":{fr:"Débloqué.",it:"Sbloccato.",en:"Unblocked."},
 "{e} entfernen? Die Person kommt danach nicht mehr in die App.":{fr:"Supprimer {e} ? La personne n’aura plus accès à l’app.",it:"Rimuovere {e}? La persona non potrà più accedere all’app.",en:"Remove {e}? The person will no longer get into the app."},
 "Entfernt.":{fr:"Supprimé.",it:"Rimosso.",en:"Removed."},
 "{e} die Admin-Rechte entziehen?":{fr:"Retirer les droits admin à {e} ?",it:"Togliere i diritti admin a {e}?",en:"Remove admin rights from {e}?"},
 "Admin-Rechte entzogen.":{fr:"Droits admin retirés.",it:"Diritti admin revocati.",en:"Admin rights removed."},
 "Einladung gelöscht.":{fr:"Invitation supprimée.",it:"Invito eliminato.",en:"Invitation deleted."},
 "Benutzerdaten nicht lesbar":{fr:"Données utilisateurs illisibles",it:"Dati utenti non leggibili",en:"User data not readable"},
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
 "Eingeschaltet sehen alle Benutzer in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).":{fr:"Activée, tous les utilisateurs voient dans l’équipe la liste des anniversaires pendant le tournage (jour et mois seulement, sans l’année).",it:"Se attiva, tutti gli utenti vedono nella crew la lista dei compleanni durante le riprese (solo giorno e mese, senza anno).",en:"When on, all users see the birthday list for the shoot in the crew tab (day and month only, no year)."},
 "3rd Unit anzeigen":{fr:"Afficher la 3rd unit",it:"Mostra la 3rd unit",en:"Show 3rd unit"},
 "Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.":{fr:"Les unités désactivées disparaissent du planning, du callsheet et des lieux. Si seule la 1st unit est active, les boutons d’unité disparaissent.",it:"Le unit disattivate spariscono da Schedule, Callsheet e Locations. Se è attiva solo la 1st unit, i pulsanti delle unit spariscono.",en:"Units that are switched off disappear from Schedule, Callsheet and Locations. If only the 1st unit is on, the unit buttons disappear."},
 "2nd Unit anzeigen":{fr:"Afficher la 2nd unit",it:"Mostra la 2nd unit",en:"Show 2nd unit"},
 "Einstellungen gespeichert.":{fr:"Réglages enregistrés.",it:"Impostazioni salvate.",en:"Settings saved."},
 "Benutzer einladen":{fr:"Inviter des utilisateurs",it:"Invita utenti",en:"Invite users"},
 "Motivliste":{fr:"Liste des lieux",it:"Lista delle location",en:"Location list"},
 "Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.":{fr:"Lien vers le Google Sheet des lieux (colonnes SCRIPT NAME, ADRESSE, SCENES, LINK ; « Tous les utilisateurs disposant du lien peuvent consulter »). Repris lors de la prochaine mise à jour horaire. Vide = liste actuelle.",it:"Link al Google Sheet delle location (colonne SCRIPT NAME, ADRESSE, SCENES, LINK; «Chiunque abbia il link può visualizzare»). Viene ripreso al prossimo aggiornamento orario. Vuoto = lista attuale.",en:"Link to the Google Sheet with the locations (columns SCRIPT NAME, ADRESSE, SCENES, LINK; “Anyone with the link can view”). Picked up at the next hourly update. Empty = current list."},
 "Bitte einen Google-Sheets-Link eingeben.":{fr:"Saisis un lien Google Sheets.",it:"Inserisci un link Google Sheets.",en:"Please enter a Google Sheets link."},
 "Karte":{fr:"Carte",it:"Mappa",en:"Map"},
 "Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.":{fr:"Lien vers la carte du bouton « Map » dans Lieux (p. ex. Google My Maps). Vide = carte par défaut.",it:"Link alla mappa per il pulsante «Map» in Locations (es. Google My Maps). Vuoto = mappa predefinita.",en:"Link to the map for the “Map” button in Locations (e.g. Google My Maps). Empty = default map."},
 "Bitte einen Link mit https:// eingeben.":{fr:"Saisis un lien commençant par https://.",it:"Inserisci un link che inizia con https://.",en:"Please enter a link starting with https://."},
 "Kontostatus":{fr:"Statut du compte",it:"Stato account",en:"Account status"},
 "Konto aktiv":{fr:"Compte actif",it:"Account attivo",en:"Account active"},
 "Gesperrt":{fr:"Bloqué",it:"Bloccato",en:"Blocked"},
 "Eingeladen, noch kein Konto":{fr:"Invité·e, pas encore de compte",it:"Invitato/a, ancora nessun account",en:"Invited, no account yet"},
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
 "Weitere Allergien (optional)":{fr:"Autres allergies (facultatif)",it:"Altre allergie (facoltativo)",en:"Other allergies (optional)"},
 "Allergien / Unverträglichkeiten (optional)":{fr:"Allergies / intolérances (facultatif)",it:"Allergie / intolleranze (facoltativo)",en:"Allergies / intolerances (optional)"},
 "Nur für die Produktion sichtbar.":{fr:"Visible uniquement par la production.",it:"Visibile solo alla produzione.",en:"Only visible to the production."},
 "Allergien":{fr:"Allergies",it:"Allergie",en:"Allergies"}
});
const LANGS=[["de","Deutsch"],["fr","Français"],["it","Italiano"],["en","English"]];
/* languages offered in the app; the main admin picks them (Firestore config/app.langs), cached for the sign-in screen */
let APPLANGS=["de","fr","it","en"];window.UNIT3=false;window.BDAYPUB=false;try{window.BDAYPUB=localStorage.getItem("appbdaypub")==="1";const u=localStorage.getItem("appunit2");if(u!==null)window.UNIT2=u==="1";window.UNIT3=localStorage.getItem("appunit3")==="1";const mu=localStorage.getItem("appmap");if(mu)window.MAPURL=mu}catch(_){}
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
    const bp=d.exists()&&d.data().bdayPublic===true;if(window.BDAYPUB!==bp){window.BDAYPUB=bp;try{localStorage.setItem("appbdaypub",bp?"1":"0")}catch(_){}render()}
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
const dietSel=(name,v)=>'<select name="'+name+'" id="'+name+'">'+DIETS.map(([k,t])=>'<option value="'+k+'"'+(k===(v||"none")?' selected':'')+'>'+L(t)+'</option>').join("")+'</select>';
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
  FB={app:a,A:auth,F:fs,auth:auth.getAuth(a),db:fs.getFirestore(a)};
  FB.auth.languageCode=LANG;
  return FB;
}
/* ---- data: fetch encrypted file, decrypt with the key from Firestore ---- */
async function fetchEnc(){const ac=typeof AbortController==="function"?new AbortController():null;const tm=setTimeout(()=>ac&&ac.abort(),25000);let r;try{r=await fetch(DATA_URL+"?t="+Date.now(),{cache:"no-store",signal:ac?ac.signal:undefined})}catch(err){throw Object.assign(new Error("network: "+(err&&err.name||err)),{code:"unavailable"})}finally{clearTimeout(tm)}if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}
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
  for(const [k,src] of [["days","days"],["crew","crew"],["locs","locations"],["places","places"],["dispos","dispos"]])S[k]=(CLEAN[k]||(x=>x))(arr(d[src]));
  MEMO.clear();saveCache();S.loaded=true;
}
/* screenplay: separate encrypted file, fetched only when a scene is opened */
window.loadScriptData=async function(){
  if(!MEMBER&&!isAdmin())throw new Error("not signed in");
  const ac=typeof AbortController==="function"?new AbortController():null;const tm=setTimeout(()=>ac&&ac.abort(),30000);
  let r;try{r=await fetch("script.enc.json?t="+Date.now(),{cache:"no-store",signal:ac?ac.signal:undefined})}finally{clearTimeout(tm)}
  if(!r.ok)throw new Error("HTTP "+r.status);
  const enc=await r.json();const key=await getDataKey();
  const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(enc.iv)},key,b64(enc.ct));
  return (JSON.parse(new TextDecoder().decode(pt)).script)||[];
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
  const ref=F.doc(db,"members",u.uid);let s=await withTimeout(F.getDoc(ref),20000,"member");
  if(!s.exists()){
    let inv=null;try{inv=await F.getDoc(F.doc(db,"invites",lc(u.email)))}catch(_){}
    if(!inv||!inv.exists()){if(isAdmin()){MEMBER=null;return "ok"}return "none"}
    let pf={};try{const x=JSON.parse(localStorage.getItem(PENDING_KEY)||"null");if(x&&x.email===lc(u.email))pf=x}catch(_){}
    const doc={active:true,email:lc(u.email),name:[pf.firstName,pf.lastName].filter(Boolean).join(" ")||inv.data().name||"",joinedAt:F.serverTimestamp()};
    for(const k of ["firstName","lastName","lang","birthday","diet","allergies"])if(pf[k])doc[k]=pf[k];
    if(Array.isArray(pf.intol)&&pf.intol.length)doc.intol=pf.intol.filter(k=>INTOL.some(x=>x[0]===k));
    if(!doc.firstName&&!doc.lastName){const sp=splitName(inv.data().name);if(sp.firstName){doc.firstName=clean(sp.firstName);if(sp.lastName)doc.lastName=clean(sp.lastName)}}
    await F.setDoc(ref,doc);try{localStorage.removeItem(PENDING_KEY)}catch(_){}
    s=await F.getDoc(ref);
  }
  const m=s.data();if(m.active!==true)return isAdmin()?"ok":"blocked";
  if(m.email!==lc(u.email))F.updateDoc(ref,{email:lc(u.email)}).catch(()=>{});
  MEMBER=m;return "ok";
}
function clearLocal(){try{localStorage.removeItem(CACHE_KEY)}catch(_){}S.days=[];S.crew=[];S.locs=[];S.places=[];S.dispos=[];S.meta=null;S.loaded=false;MEMO.clear();DATAKEY=null;MEMBER=null;LASTSTAMP=null;SCRIPT=null;COADMIN=false;ADM.loaded=false;ADM.mem=[];ADM.inv=[];ADM.adm=[]}
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
function GBTN(){if(isIOS()&&isStandalone())return '';return '<button type="button" class="gbtn ggoogle" data-gact="google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>'+L("Mit Google anmelden")+'</button><div class="gor"><span>'+L("oder")+'</span></div>'}
function showGate(mode,msg,isErr){
  AUTHMODE=mode||AUTHMODE;const g=gateEl();
  const em=ME?esc(ME.email):(g.querySelector("#gem")?esc(g.querySelector("#gem").value):"");
  const head='<h2>Tschugger <span>Tigerblood</span></h2>';
  const langs='<div class="lang glang"><button type="button" data-glang="de">DE</button><button type="button" data-glang="fr">FR</button><button type="button" data-glang="it">IT</button><button type="button" data-glang="en">EN</button></div>';
  const note=msg?'<p class="'+(isErr?'gerr':'gok')+'" role="alert">'+esc(msg)+'</p>':'<p class="gerr" role="alert"></p>';
  let f="";
  if(AUTHMODE==="login")f='<form class="gbox" data-f="login">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die du der Produktion angegeben hast.")+'</p>'+GBTN()+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="current-password" required><button type="submit">'+L("Anmelden")+'</button>'+note+'<button type="button" class="glink" data-gmode="reset">'+L("Passwort vergessen?")+'</button><button type="button" class="glink" data-gmode="register">'+L("Erstes Mal hier? Konto erstellen")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="register")f='<form class="gbox" data-f="register">'+head+'<p class="ghint">'+L("Nur für die Crew von TSCHUGGER Tigerblood. Melde dich mit der E-Mail-Adresse an, die du der Produktion angegeben hast.")+'</p>'+GBTN()+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><label for="gpw">'+L("Passwort")+'</label><input id="gpw" type="password" autocomplete="new-password" minlength="8" required><label for="gpw2">'+L("Passwort wiederholen")+'</label><input id="gpw2" type="password" autocomplete="new-password" minlength="8" required><p class="ghint">'+L("Mindestens 8 Zeichen.")+'</p><button type="submit">'+L("Konto erstellen")+'</button>'+note+'<button type="button" class="glink" data-gmode="login">'+L("Schon ein Konto? Anmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="reset")f='<form class="gbox" data-f="reset">'+head+'<label for="gem">'+L("E-Mail")+'</label><input id="gem" type="email" autocomplete="username" required value="'+em+'"><button type="submit">'+L("Link zum Zurücksetzen senden")+'</button>'+note+'<button type="button" class="glink" data-gmode="login">'+L("Zurück")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="verify")f='<form class="gbox" data-f="verify">'+head+'<p class="gtitle">'+L("Bitte bestätige zuerst deine E-Mail-Adresse.")+'</p><p class="ghint">'+L("Wir haben dir eine Mail mit einem Bestätigungslink geschickt. Tippe auf den Link und komm dann hierher zurück.")+'</p><p class="ghint"><b>'+em+'</b></p><button type="submit">'+L("Ich habe bestätigt")+'</button>'+note+'<button type="button" class="glink" data-gact="resend">'+L("Mail nochmals senden")+'</button><button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</form>';
  else if(AUTHMODE==="denied"||AUTHMODE==="blocked")f='<div class="gbox">'+head+'<p class="gtitle">'+L("Kein Zugang")+'</p><p class="ghint">'+(AUTHMODE==="blocked"?L("Dein Zugang wurde gesperrt. Bitte melde dich bei der Produktion."):L("Deine Adresse ist (noch) nicht für die Crew-App freigeschaltet. Bitte melde dich bei der Produktion."))+'</p><p class="ghint"><b>'+em+'</b></p><button type="button" class="gbtn" data-gact="retry">'+L("Aktualisieren")+'</button><button type="button" class="glink" data-gact="signout">'+L("Abmelden")+'</button>'+langs+'</div>';
  else if(AUTHMODE==="wait")f='<div class="gbox">'+head+'<p class="ghint">'+L("Bitte warten …")+'</p></div>';
  verifyPoll(AUTHMODE==="verify");
  g.innerHTML=f;applyLangs();g.querySelectorAll("[data-glang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.glang===LANG));
  g.hidden=false;document.body.style.overflow="hidden";
  const first=g.querySelector("input:not([value]),input[value='']")||g.querySelector("#gpw");if(first&&AUTHMODE!=="wait")setTimeout(()=>first.focus(),50);
}
let VERIFYT=null;
function verifyPoll(on){clearInterval(VERIFYT);VERIFYT=null;if(!on)return;
  VERIFYT=setInterval(async()=>{try{const {auth}=await fb();const u=auth.currentUser;if(!u){verifyPoll(false);return}
    await u.reload();if(auth.currentUser.emailVerified){verifyPoll(false);await auth.currentUser.getIdToken(true);afterSignIn(auth.currentUser)}}catch(_){}},5000)}
function hideGate(){verifyPoll(false);const g=document.getElementById("gate");if(g){g.hidden=true;g.innerHTML=""}document.body.style.overflow=""}
function gateMsg(t,isErr){const p=document.querySelector("#gate .gerr,#gate .gok");if(p){p.className=isErr?"gerr":"gok";p.textContent=t}}
async function onGateSubmit(e){
  e.preventDefault();const f=e.target;const btn=f.querySelector("button[type=submit]");if(btn)btn.disabled=true;gateMsg("",true);
  try{
    const {A,auth}=await fb();const em=f.querySelector("#gem")?f.querySelector("#gem").value.trim():"";const pw=f.querySelector("#gpw")?f.querySelector("#gpw").value:"";
    if(f.dataset.f==="login"){window.__justSignedIn=true;await A.signInWithEmailAndPassword(auth,em,pw)}
    else if(f.dataset.f==="register"){
      if(pw.length<8)throw {code:"weak-password"};
      if(pw!==f.querySelector("#gpw2").value){gateMsg(L("Die Passwörter stimmen nicht überein."),true);if(btn)btn.disabled=false;return}
      window.__justSignedIn=true;const c=await A.createUserWithEmailAndPassword(auth,em,pw);
      try{await A.sendEmailVerification(c.user,{url:location.origin+location.pathname})}catch(_){}
    }
    else if(f.dataset.f==="reset"){try{await A.sendPasswordResetEmail(auth,em,{url:location.origin+location.pathname})}catch(err){if(!/user-not-found/.test(err.code||""))throw err}gateMsg(L("Wenn es für diese Adresse ein Konto gibt, kommt gleich eine Mail zum Zurücksetzen."),false)}
    else if(f.dataset.f==="verify"){await ME.reload();if(auth.currentUser.emailVerified){await ME.getIdToken(true);await afterSignIn(auth.currentUser)}else gateMsg(L("Noch nicht bestätigt. Schau auch im Spam-Ordner nach."),true)}
  }catch(err){console.error(err);gateMsg(errText(err),true)}
  if(btn)btn.disabled=false;
}
async function onGateClick(e){
  const lb=e.target.closest("[data-glang]");if(lb){LANG=lb.dataset.glang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;showGate(AUTHMODE);render();return}
  const m=e.target.closest("[data-gmode]");if(m){showGate(m.dataset.gmode);return}
  const a=e.target.closest("[data-gact]");if(!a)return;
  const {A,auth}=await fb();
  if(a.dataset.gact==="signout"){await A.signOut(auth)}
  else if(a.dataset.gact==="resend"){try{await A.sendEmailVerification(auth.currentUser,{url:location.origin+location.pathname});gateMsg(L("Mail gesendet."),false)}catch(err){gateMsg(errText(err),true)}}
  else if(a.dataset.gact==="retry"){if(auth.currentUser)afterSignIn(auth.currentUser)}
  else if(a.dataset.gact==="google"){
    const prov=new A.GoogleAuthProvider();prov.setCustomParameters({prompt:"select_account"});window.__justSignedIn=true;
    try{if(isStandalone())await A.signInWithRedirect(auth,prov);else await A.signInWithPopup(auth,prov)}
    catch(err){const c=err.code||"";
      if(/popup-blocked|operation-not-supported|web-storage/.test(c)){try{await A.signInWithRedirect(auth,prov)}catch(e2){gateMsg(errText(e2),true)}}
      else if(/popup-closed|cancelled-popup/.test(c))gateMsg(L("Google-Anmeldung abgebrochen."),true);
      else gateMsg(errText(err),true)}
  }
}
async function afterSignIn(u){
  ME=u;
  if(!u.emailVerified){showGate("verify");return}
  let st;try{st=await checkMember()}catch(err){console.error(err);
    if(isOffline(err)&&S.days.length){hideGate();acctButton(true);showMsg(L("Offline – du siehst den zuletzt geladenen Stand."),6000);return}
    showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);return}
  if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":"denied");return}
  hideGate();acctButton(true);PUBB.loaded=false;PUBB.list=[];
  const prof=MEMBER||{};
  let hasLocal=false;try{hasLocal=!!localStorage.getItem("lang")}catch(_){}
  if(prof.lang&&prof.lang!==LANG&&(window.__justSignedIn||!hasLocal)&&WDS[prof.lang]){LANG=prof.lang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
  try{await load(true)}catch(err){console.error(err);showMsg(isOffline(err)&&S.days.length?L("Offline – du siehst den zuletzt geladenen Stand."):loadErr(err),isOffline(err)?6000:15000)}
  await fillNamesFromCrew();
  if(MEMBER&&!MEMBER.diet)setTimeout(()=>showAcct(true),400);
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
}
const isPwUser=()=>!!(ME&&(ME.providerData||[]).some(p=>p.providerId==='password'));
let ONBOARD=false;
function nameFields(){
  const cn=crewNames();
  if(cn)return '<div class="pname"><span>'+L("Vorname")+'</span><b>'+esc(cn.firstName)+'</b><span>'+L("Nachname")+'</span><b>'+esc(cn.lastName||"–")+'</b></div><p class="ghint">'+L("Aus der Crewliste übernommen.")+'</p>';
  return '<label>'+L("Vorname")+'<input type="text" name="fn" autocomplete="given-name" required value="'+esc((MEMBER&&MEMBER.firstName)||"")+'"></label><label>'+L("Nachname")+'<input type="text" name="ln" autocomplete="family-name" required value="'+esc((MEMBER&&MEMBER.lastName)||"")+'"></label>';
}
function profileForm(onb){
  return '<form data-af="pf">'+nameFields()+'<label>'+L("Sprache der App")+langSel("lg",(MEMBER&&MEMBER.lang)||LANG)+'</label><label>'+L("Geburtsdatum (optional)")+'<input type="date" name="bd" autocomplete="bday" value="'+esc((MEMBER&&MEMBER.birthday)||"")+'"></label><label>'+L("Ernährung")+dietSel("dt",normDiet(MEMBER).diet)+'</label><label>'+L("Verträglichkeiten")+'</label>'+intolBoxes("pint",normDiet(MEMBER).intol)+'<label>'+L("Weitere Allergien (optional)")+'<input type="text" name="al" maxlength="200" value="'+esc((MEMBER&&MEMBER.allergies)||"")+'"></label><p class="ghint">'+L("Nur für die Produktion sichtbar.")+'</p><button type="submit">'+L(onb?"Weiter":"Speichern")+'</button><p class="amsg" role="alert"></p></form>';
}
function showAcct(needProfile){
  let s=document.getElementById("acct");
  if(!s){s=document.createElement("div");s.id="acct";s.className="a2hs";s.setAttribute("role","dialog");s.setAttribute("aria-modal","true");document.body.appendChild(s);
    s.addEventListener("click",onAcctClick);s.addEventListener("submit",onAcctSubmit)}
  ONBOARD=needProfile===true&&!!MEMBER;
  if(ONBOARD){s.innerHTML='<div class="a2box acbox"><h3>'+L("Willkommen!")+'</h3><p>'+L("Bitte fülle vor dem ersten Start dein Profil aus.")+'</p><p class="ghint">'+esc(ME.email)+'</p>'+profileForm(true)+'<div class="a2b"><button class="lnk" data-ac="signout">'+L("Abmelden")+'</button></div></div>';s.hidden=false;return}
  s.innerHTML='<div class="a2box acbox"><h3>'+L("Mein Konto")+'</h3><p>'+L("Angemeldet als")+' <b>'+esc(ME.email)+'</b></p>'+
    (isAdmin()?'<div class="a2b"><button class="pri" data-ac="admin">'+L("Benutzer verwalten")+'</button></div>':'')+
    (MEMBER||isAdmin()?'<section class="psec"><h4>'+L("Profil")+'</h4>'+profileForm(false)+'</section>':'')+
    (isPwUser()?'':'<p class="ghint">'+L("Du bist mit Google angemeldet. Passwort und Adresse verwaltest du in deinem Google-Konto.")+'</p>')+(!isPwUser()?'':'<details><summary>'+L("Passwort ändern")+'</summary><form data-af="pw"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neues Passwort")+'<input type="password" name="pw" autocomplete="new-password" minlength="8" required></label><label>'+L("Passwort wiederholen")+'<input type="password" name="pw2" autocomplete="new-password" minlength="8" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p><button type="button" class="glink" data-ac="pwreset">'+L("Passwort vergessen?")+'</button></form></details>'+
    '<details><summary>'+L("E-Mail-Adresse ändern")+'</summary><form data-af="em"><label>'+L("Aktuelles Passwort")+'<input type="password" name="cur" autocomplete="current-password" required></label><label>'+L("Neue E-Mail-Adresse")+'<input type="email" name="em" autocomplete="email" required></label><button type="submit">'+L("Speichern")+'</button><p class="amsg" role="alert"></p></form></details>')+
    '<div class="a2b"><button data-ac="signout">'+L("Abmelden")+'</button><button class="lnk" data-ac="close">'+L("Schliessen")+'</button></div></div>';
  s.hidden=false;
}
async function onAcctClick(e){
  const s=document.getElementById("acct");if(e.target===s){if(!ONBOARD)s.hidden=true;return}
  const b=e.target.closest("[data-ac]");if(!b)return;
  if(b.dataset.ac==="close")s.hidden=true;
  else if(b.dataset.ac==="pwreset"){const msg=b.closest("form").querySelector(".amsg");msg.className="amsg";msg.textContent="";b.disabled=true;
    try{const {A,auth}=await fb();await A.sendPasswordResetEmail(auth,auth.currentUser.email,{url:location.origin+location.pathname});msg.classList.add("ok");msg.textContent=L("Link zum Zurücksetzen gesendet an")+" "+auth.currentUser.email+". "+L("Schau auch im Spam-Ordner nach.")}
    catch(err){console.error(err);msg.textContent=errText(err)}b.disabled=false}
  else if(b.dataset.ac==="admin"){s.hidden=true;S.tab="admin";window.scrollTo(0,0);render()}
  else if(b.dataset.ac==="signout"){s.hidden=true;const {A,auth}=await fb();await A.signOut(auth)}
}
async function onAcctSubmit(e){
  e.preventDefault();const f=e.target,msg=f.querySelector(".amsg"),btn=f.querySelector("button");btn.disabled=true;msg.className="amsg";msg.textContent="";
  try{
    const {A,auth,F,db}=await fb();const u=auth.currentUser;
    if(f.dataset.af==="pf"){
      const cn=crewNames();
      const upd={firstName:cn?cn.firstName:clean(f.fn.value),lastName:cn?cn.lastName:clean(f.ln.value),lang:f.lg.value,birthday:f.bd.value||"",diet:f.dt.value,intol:readBoxes(f,"pint"),allergies:String(f.al.value||"").trim().slice(0,200)};
      upd.name=[upd.firstName,upd.lastName].filter(Boolean).join(" ");
      const ref=F.doc(db,"members",u.uid);
      if(MEMBER)await F.updateDoc(ref,upd);else await F.setDoc(ref,Object.assign({active:true,email:lc(u.email),joinedAt:F.serverTimestamp()},upd));
      MEMBER=Object.assign({},MEMBER||{active:true,email:lc(u.email)},upd);
      writeOwnBday(upd.name,upd.birthday);
      if(isAdmin())ADM.loaded=false;
      if(upd.lang!==LANG&&WDS[upd.lang]){LANG=upd.lang;store("lang",LANG);applyStatic();if(FB)FB.auth.languageCode=LANG;render()}
      if(ONBOARD){ONBOARD=false;document.getElementById("acct").hidden=true;showMsg(L("Profil gespeichert."),3000);btn.disabled=false;return}
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
  }catch(err){console.error(err);msg.textContent=err&&err.code==="x"?err.message:(/email-already-in-use/.test(err.code||"")?L("Diese Adresse wird schon verwendet."):errText(err))}
  btn.disabled=false;
}
/* ---- admin: invitations and members (German only; visible to admins) ---- */
const ADM={inv:[],mem:[],adm:[],q:"",loaded:false,busy:false};
async function admLoad(){
  const {F,db}=await fb();
  const [i,m,a]=await Promise.all([F.getDocs(F.collection(db,"invites")),F.getDocs(F.collection(db,"members")),F.getDocs(F.collection(db,"admins")).catch(()=>({docs:[]}))]);
  ADM.adm=a.docs.map(d=>d.id);ADM.inv=i.docs.map(d=>Object.assign({id:d.id},d.data()));ADM.mem=m.docs.map(d=>Object.assign({uid:d.id},d.data()));ADM.at=Date.now();admIndex();ADM.loaded=true;render();syncBdays();
}
function crewEmails(){const out=[],seen=new Set();for(const g of S.crew)for(const p of (g.people||[])){const e=lc(p.email);if(!e||!/@/.test(e)||seen.has(e))continue;seen.add(e);out.push({email:e,name:p.name||"",role:p.role||""})}return out}
/* collapsible admin sections in the crew tab; open by default, state remembered per section */
const SECS={};try{for(const k of ["cater","bcal"])SECS[k]=localStorage.getItem("sec:"+k)!=="0";SECS.appset=localStorage.getItem("sec:appset")==="1"}catch(_){SECS.cater=SECS.bcal=true}
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
VIEWS.admin=function(){
  if(!isAdmin())return '<div class="empty">'+L("Kein Zugang")+'</div>';
  if(ADM.loaded&&!ADM.busy&&!ADM.loading&&Date.now()-(ADM.at||0)>60000){ADM.loading=true;admLoad().catch(()=>{}).finally(()=>{ADM.loading=false})}
  if(!ADM.loaded){admLoad().catch(err=>{console.error(err);showMsg(L("Benutzerliste konnte nicht geladen werden:")+" "+(err.message||err),6000)});return '<div class="empty">'+L("Lade Benutzer …")+'</div>'}
  const memBy={};ADM.mem.forEach(m=>memBy[m.email]=m);
  const invBy={};ADM.inv.forEach(i=>invBy[i.id]=i);
  const rows=[];const seen=new Set();
  /* display name: crew list first, otherwise the first/last name the person entered */
  const nm=m=>{if(!m)return"";const cp=crewPerson(m.email);return (cp&&cp.name)||[m.firstName,m.lastName].filter(Boolean).join(" ")||m.name||""};
  for(const i of ADM.inv){const m=memBy[i.id];rows.push({email:i.id,name:nm(m)||i.name||"",inv:true,m});seen.add(i.id)}
  for(const m of ADM.mem)if(!seen.has(m.email))rows.push({email:m.email,name:nm(m),inv:false,m});
  rows.sort((a,b)=>(a.name||a.email).localeCompare(b.name||b.email,LANG));
  const q=lc(ADM.q);const vis=rows.filter(r=>!q||(r.email+" "+r.name).toLowerCase().includes(q));
  const newCrew=crewEmails().filter(c=>!invBy[c.email]&&!memBy[c.email]);
  const st=r=>r.m?(r.m.active===true?'<span class="ust ok">'+(LANG==="de"?"aktiv":L("aktiv_1"))+'</span>':'<span class="ust off">'+L("gesperrt")+'</span>'):'<span class="ust wait">'+L("eingeladen")+'</span>';
  const site=location.origin+location.pathname;
  const mail=r=>"mailto:"+encodeURIComponent(r.email)+"?subject="+encodeURIComponent("TSCHUGGER Tigerblood – "+(LANG==="de"?"Crew-App":L("Crew-App")))+"&body="+encodeURIComponent((I18N.MAIL_BODY[LANG]||I18N.MAIL_BODY.de).replace("{n}",r.name?" "+r.name.split(" ")[0]:"").replace("{site}",site).replace("{e}",r.email));
  const own=isOwner();const isAdm=e=>ADMINS.includes(e)||ADM.adm.includes(e);
  const admSec=own?'<div class="admins"><h3>'+L("Administratoren")+'</h3><p class="ahint">'+L("Administratoren können Leute einladen und sehen in der Crew Essen und Geburtstage. Sperren und Entfernen kannst nur du. Admins ernennst du unten bei der Person mit «Zum Admin machen».")+'</p>'+
    '<div class="arow"><span>'+esc(ADMINS[0])+'</span><span class="ust ok">'+L("Haupt-Admin")+'</span></div>'+
    ADM.adm.map(e=>[e,((rows.find(r=>r.email===e)||{}).name)||(crewPerson(e)||{}).name||""]).sort((a,b)=>(a[1]||a[0]).localeCompare(b[1]||b[0],LANG)).map(([e,n])=>'<div class="arow"><span>'+esc(n||e)+'</span><button data-adm="rmadmin" data-em="'+esc(e)+'">'+L("Entfernen")+'</button></div>').join("")+
    '</div>'+
    '<details class="admins asetd" data-sec="appset"'+(SECS.appset?' open':'')+'><summary>'+L("Einstellungen der App")+'</summary><form class="alangs" data-adm="langs"><p class="ahint"><b>'+L("Sprachen")+'</b> – '+L("Nur diese Sprachen stehen in der App zur Auswahl. Mindestens eine.")+'</p><div class="chk">'+LANGS.map(([k,t])=>'<label class="ck"><input type="checkbox" name="al" value="'+k+'"'+(APPLANGS.includes(k)?' checked':'')+'> '+t+'</label>').join("")+'</div>'+
    '<p class="ahint"><b>Units</b> – '+L("Ausgeschaltete Units verschwinden aus Schedule, Callsheet und Locations. Ist nur die 1st Unit aktiv, entfallen die Unit-Knöpfe.")+'</p><div class="chk"><label class="ck"><input type="checkbox" name="u2"'+(window.UNIT2!==false?' checked':'')+'> '+L("2nd Unit anzeigen")+'</label><label class="ck"><input type="checkbox" name="u3"'+(window.UNIT3===true?' checked':'')+'> '+L("3rd Unit anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Geburtstage")+'</b> – '+L("Eingeschaltet sehen alle Benutzer in der Crew die Geburtstagsliste der Drehzeit (nur Tag und Monat, ohne Jahrgang).")+'</p><div class="chk"><label class="ck"><input type="checkbox" name="bp"'+(window.BDAYPUB===true?' checked':'')+'> '+L("Geburtstagsliste allen anzeigen")+'</label></div>'+
    '<p class="ahint"><b>'+L("Motivliste")+'</b> – '+L("Link zum Google Sheet mit den Motiven (Spalten SCRIPT NAME, ADRESSE, SCENES, LINK; «Jeder mit dem Link darf ansehen»). Wird bei der nächsten stündlichen Aktualisierung übernommen. Leer = bisherige Liste.")+'</p><input class="amap" type="url" name="sheet" inputmode="url" placeholder="https://docs.google.com/spreadsheets/d/…" value="'+esc(window.LOCSHEET||"")+'">'+
    '<p class="ahint"><b>'+L("Karte")+'</b> – '+L("Link zur Karte für den Knopf «Map» in Locations (z. B. Google My Maps). Leer = Standardkarte.")+'</p><input class="amap" type="url" name="map" inputmode="url" placeholder="https://www.google.com/maps/d/…" value="'+esc(window.MAPURL||"")+'"><button type="submit">'+L("Speichern")+'</button></form></details>':'';
  let h='<section class="adm"><h2 class="dh">'+L("Benutzer verwalten")+'</h2>'+
    admSec+
    '<div class="admins"><h3>'+L("Benutzer einladen")+'</h3><p class="ahint">'+L("Nur eingeladene Adressen können ein Konto erstellen (E-Mail/Passwort oder Google). Gesperrte oder entfernte Personen kommen sofort nicht mehr in die App. Passwort und E-Mail-Adresse verwaltet jede Person selbst.")+'</p>'+
    '<form class="aform" data-adm="add"><input name="em" type="email" placeholder="'+esc(L("E-Mail-Adresse"))+'" required><input name="nm" type="text" placeholder="'+esc(L("Name (optional)"))+'"><button type="submit">'+L("Einladen")+'</button></form>'+
    (newCrew.length?'<button class="abtn" data-adm="crew">'+esc(L("Alle {n} Adressen aus der Crewliste einladen").replace("{n}",newCrew.length))+'</button>':'')+'</div>'+
    '<div class="astats">'+rows.length+' '+L("Benutzer")+' · '+rows.filter(r=>r.m&&r.m.active===true).length+' '+L("aktiv")+' · '+rows.filter(r=>!r.m).length+' '+L("noch nicht registriert")+'</div>'+
    '<input class="search" id="aq" type="search" placeholder="'+esc(L("Benutzer suchen"))+'" value="'+esc(ADM.q)+'">'+
    '<div class="people">'+vis.map(r=>'<div class="p"><div class="hd"><span class="nm">'+esc(r.name||r.email)+'</span>'+(isAdm(r.email)?'<span class="ust adm">'+L("Admin")+'</span>':'')+st(r)+'</div><div class="ct"><span class="em">'+esc(r.email)+'</span>'+(r.m&&r.m.lang?'<span>'+esc(r.m.lang.toUpperCase())+'</span>':'')+'</div><div class="aacts">'+
      (!r.m?'<a href="'+mail(r)+'">'+L("Einladungsmail")+'</a>':'')+
      (own&&!ADMINS.includes(r.email)?(ADM.adm.includes(r.email)?'<button data-adm="rmadmin" data-em="'+esc(r.email)+'">'+L("Admin entfernen")+'</button>':'<button data-adm="mkadmin" data-em="'+esc(r.email)+'">'+L("Zum Admin machen")+'</button>'):'')+
      (own&&r.m&&!ADMINS.includes(r.email)?(r.m.active===true?'<button data-adm="block" data-uid="'+esc(r.m.uid)+'">'+L("Sperren")+'</button>':'<button data-adm="unblock" data-uid="'+esc(r.m.uid)+'">'+L("Entsperren")+'</button>'):'')+
      (ADMINS.includes(r.email)?'':own&&r.m?'<button data-adm="remove" data-uid="'+esc(r.m.uid)+'" data-em="'+esc(r.email)+'">'+L("Entfernen")+'</button>':(r.inv&&!r.m?'<button data-adm="uninvite" data-em="'+esc(r.email)+'">'+L("Einladung löschen")+'</button>':''))+
      '</div></div>').join("")+'</div></section>';
  return h;
};
document.addEventListener("input",e=>{if(e.target.id==="aq"){ADM.q=e.target.value;const p=e.target.selectionStart;render();const i=$("#aq");if(i){i.focus();i.setSelectionRange(p,p)}}});
document.addEventListener("submit",async e=>{
  const fl=e.target.closest('[data-adm="langs"]');
  if(fl){e.preventDefault();if(!isOwner())return;const l=[...fl.querySelectorAll('input[name=al]:checked')].map(x=>x.value);
    if(!l.length){showMsg(L("Bitte mindestens eine Sprache wählen."),4000);return}
    try{const {F,db}=await fb();const u2=!!fl.querySelector('input[name=u2]').checked,u3=!!fl.querySelector('input[name=u3]').checked,bp=!!fl.querySelector('input[name=bp]').checked;const mu=String(fl.querySelector('input[name=map]').value||"").trim();
    if(mu&&!/^https:\/\/\S+$/.test(mu)){showMsg(L("Bitte einen Link mit https:// eingeben."),4000);return}
    const sh=String(fl.querySelector('input[name=sheet]').value||"").trim();
    if(sh&&!/^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(sh)){showMsg(L("Bitte einen Google-Sheets-Link eingeben."),4000);return}
    await F.setDoc(F.doc(db,"config","app"),{langs:l,unit2:u2,unit3:u3,mapUrl:mu,bdayPublic:bp,locSheet:sh},{merge:true});window.LOCSHEET=sh;APPLANGS=l;window.UNIT2=u2;window.UNIT3=u3;window.BDAYPUB=bp;if(bp)syncBdays(true);try{localStorage.setItem("appbdaypub",bp?"1":"0")}catch(_){}window.MAPURL=mu;try{localStorage.setItem("applangs",JSON.stringify(l));localStorage.setItem("appunit2",u2?"1":"0");localStorage.setItem("appunit3",u3?"1":"0");localStorage.setItem("appmap",mu)}catch(_){}applyLangs();render();showMsg(L("Einstellungen gespeichert."),3000)}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
    return}
  const f=e.target.closest('[data-adm="add"]');if(!f)return;e.preventDefault();
  const em=lc(f.em.value),nm=f.nm.value.trim();if(!/@/.test(em))return;
  try{const {F,db}=await fb();await F.setDoc(F.doc(db,"invites",em),{name:nm,addedAt:F.serverTimestamp()});showMsg(em+" "+L("eingeladen."),3000);await admLoad()}catch(err){showMsg(L("Fehler:")+" "+(err.message||err),6000)}
});
document.addEventListener("click",async e=>{
  const b=e.target.closest("button[data-adm]");if(!b||ADM.busy)return;ADM.busy=true;
  try{
    const {F,db}=await fb();const a=b.dataset.adm;
    if(a==="crew"){const list=crewEmails().filter(c=>!ADM.inv.some(i=>i.id===c.email)&&!ADM.mem.some(m=>m.email===c.email));
      if(confirmSafe(L("{n} Adressen aus der Crewliste einladen?").replace("{n}",list.length))){
        for(let i=0;i<list.length;i+=400){const batch=F.writeBatch(db);list.slice(i,i+400).forEach(c=>batch.set(F.doc(db,"invites",c.email),{name:c.name,role:c.role,addedAt:F.serverTimestamp()}));await batch.commit()}
        showMsg(L("{n} Adressen eingeladen.").replace("{n}",list.length),4000)}}
    else if((a==="block"||a==="remove"||a==="uninvite")&&ADMINS.includes(b.dataset.em||(ADM.mem.find(m=>m.uid===b.dataset.uid)||{}).email)){showMsg(L("Der Haupt-Admin kann nicht gesperrt oder entfernt werden."),4000)}
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
window.crewHead=function(){
  if(!isAdmin()){if(!window.BDAYPUB||!ME)return"";if(!PUBB.loaded)loadPubBdays();return PUBB.loaded?bdayHTML():""}
  ensureAdm();
  return '<div class="admv">'+togBtn("food","Essen")+(ADM.err?'<span class="admerr">'+L("Benutzerdaten nicht lesbar")+' ('+esc(ADM.err)+') – '+L("Firestore-Regeln prüfen.")+'</span>':'')+togBtn("bday","Geburtstage")+togBtn("acct","Kontostatus")+'<button type="button" class="foodtog ico vcall" data-vcall aria-label="'+esc(L("Alle Kontakte als VCF"))+'" title="'+esc(L("Alle Kontakte als VCF"))+'"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="7" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5 1.3 0 2.5.4 3.4 1M15 3v10M11.5 9.5 15 13l3.5-3.5M11 20h9"/></svg><b>VCF</b></button>'+'</div>'+(ADM.loaded?bdayHTML()+cateringHTML():"");
};
document.addEventListener("click",e=>{if(!e.target.closest("[data-vcall]")||!isAdmin())return;const {text,n}=allVCards();if(!n)return;saveVcf(text,"TSCHUGGER Tigerblood Crew");showMsg(n+" "+L("Kontakte als VCF gespeichert."),4000)});
document.addEventListener("click",e=>{const b=e.target.closest("[data-admv]");if(!b)return;const k=b.dataset.admv;ADMV[k]=!ADMV[k];ADM.err="";if(ADMV[k]&&!ADM.loading&&Date.now()-(ADM.at||0)>60000)ADM.loaded=false;try{localStorage.setItem("admv2:"+k,ADMV[k]?"1":"0")}catch(_){}render()});
window.crewExtra=function(p){
  if(!isAdmin()||!(ADMV.food||ADMV.bday||ADMV.acct)||!p)return"";
  if(!ADM.loaded){ensureAdm();return ADM.err?"":'<div class="pinfo"><span class="na">…</span></div>'}
  const m=memberFor(p),ch=[],na=t=>'<span class="na">'+esc(t)+'</span>';
  if(ADMV.acct){
    if(!m){const e=lc(p.email);ch.push(na(L(e&&ADM.inv.some(i=>i.id===e)?"Eingeladen, noch kein Konto":"Noch kein Konto")))}
    else ch.push(m.active===true?'<span class="ok">'+esc(L("Konto aktiv"))+'</span>':'<span class="off">'+esc(L("Gesperrt"))+'</span>');
    const ems=[lc(p.email),m&&m.email].filter(Boolean);
    if(ems.some(e=>ADMINS.includes(e)))ch.push('<span class="adm">'+esc(L("Haupt-Admin"))+'</span>');
    else if(ems.some(e=>ADM.adm.includes(e)))ch.push('<span class="adm">'+esc(L("Admin"))+'</span>');
  }
  if(m&&ADMV.bday){const b=bdShort(m.birthday);ch.push(b?'<span class="bday">'+esc(L("Geburtstag"))+' '+esc(b)+'</span>':(ADMV.acct?na(L("Geburtstag")+": –"):""))}
  if(m&&ADMV.food){const t=dietText(m);ch.push(t?'<span class="diet">'+esc(t)+'</span>':(m.diet?"":(ADMV.acct?na(L("Essen")+": "+L("keine Angaben")):"")))}
  const h=ch.filter(Boolean).join("");return h?'<div class="pinfo">'+h+'</div>':"";
};


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
    try{if(await load(true)){const c=lastCheck(S.meta);showMsg(L("Neueste Daten geladen.")+(c?" "+L("Dropbox zuletzt geprüft")+" "+fmtStamp(c)+".":""),5000)}}
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
    A.onAuthStateChanged(auth,u=>{
      if(!u){ME=null;acctButton(false);clearLocal();if(S.tab==="admin")S.tab="plan";render();showGate("login");return}
      afterSignIn(u);
    });
  }catch(err){console.error(err);if(!S.days.length)showGate("login",L("Anmeldung nicht erreichbar. Bitte Internetverbindung prüfen."),true);else{hideGate();showMsg(L("Offline – du siehst den zuletzt geladenen Stand."),6000)}}
  /* back online after starting without connection: start sign-in again */
  window.addEventListener("online",()=>{if(!FB&&!FBP)location.reload();else if(ME)tick()});
  const tick=async()=>{
    if(document.visibilityState!=="visible"||!ME||!ME.emailVerified)return;
    try{const st=await checkMember();if(st!=="ok"){clearLocal();render();showGate(st==="blocked"?"blocked":"denied");return}}catch(_){return}
    load(false).catch(()=>{});
  };
  setInterval(tick,POLL_MS);
  document.addEventListener("visibilitychange",tick);
})();
