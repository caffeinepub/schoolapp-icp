# SchoolApp ICP

## Current State
Volledig werkende school-app met:
- Internet Identity login
- Gebruikersgoedkeuring (beheerder keurt leraren goed)
- Beheerderspagina voor goedkeuring/weigering
- Wachtscherm voor niet-goedgekeurde gebruikers
- Naamregistratie met admin-detectie
- Klassen, leerlingen, presentie en cijfers

## Requested Changes (Diff)

### Add
- Geen

### Modify
- Backend: alle autorisatie-checks verwijderen; elke ingelogde gebruiker heeft direct toegang tot alle functies
- Backend: geen user-approval, geen access-control, geen admin-logica meer
- Frontend App.tsx: flow vereenvoudigen tot login -> classes (geen register-name, geen waiting-approval, geen admin scherm)
- Frontend ClassesPage: "Beheer" knop verwijderen
- Frontend useQueries.ts: alle approval/admin hooks verwijderen

### Remove
- Backend: user-approval module
- Backend: authorization module
- Frontend: AdminPage
- Frontend: WaitingApprovalPage
- Frontend: NameRegistrationPage

## Implementation Plan
1. Genereer nieuwe backend zonder autorisatie of goedkeuringssysteem
2. Pas frontend aan: App.tsx vereenvoudigen, ClassesPage opschonen, useQueries.ts opschonen, verwijder ongebruikte pagina's
