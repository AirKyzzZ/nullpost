# Diagramme de cas d'utilisation — NullPost

```mermaid
flowchart TB
    subgraph "NullPost"
        UC1["Se connecter via GitHub OAuth"]
        UC2["Initialiser le chiffrement<br/>(passphrase, premier login)"]
        UC3["Déverrouiller<br/>(saisir la passphrase)"]
        UC4["Créer un post<br/>(thought ou longform)"]
        UC5["Modifier / supprimer un post"]
        UC6["Filtrer le feed par tag"]
        UC7["Rechercher dans les posts<br/>(côté client)"]
        UC8["Téléverser un média"]
        UC9["Gérer les tags<br/>(CRUD + couleurs)"]
        UC10["Changer la passphrase<br/>(re-chiffrement transactionnel)"]
        UC11["Exporter ses données (JSON)"]
        UC12["Consulter la page RGPD"]
        UC13["Consulter un profil public"]
    end

    Owner((Propriétaire de l'instance))
    Visitor((Visiteur anonyme))

    Owner --> UC1
    Owner --> UC2
    Owner --> UC3
    Owner --> UC4
    Owner --> UC5
    Owner --> UC6
    Owner --> UC7
    Owner --> UC8
    Owner --> UC9
    Owner --> UC10
    Owner --> UC11
    Visitor --> UC12
    Visitor --> UC13

    UC2 -.requiert.-> UC1
    UC3 -.requiert.-> UC1
    UC4 -.requiert.-> UC3
    UC5 -.requiert.-> UC3
    UC6 -.requiert.-> UC3
    UC7 -.requiert.-> UC3
    UC8 -.requiert.-> UC3
    UC9 -.requiert.-> UC3
    UC10 -.requiert.-> UC3
    UC11 -.requiert.-> UC3
```

## Acteurs

- **Propriétaire de l'instance** : un seul utilisateur authentifié via GitHub OAuth ;
  identifié par `ALLOWED_GITHUB_USER`. Toutes les actions de création / modification
  passent par lui.
- **Visiteur anonyme** : peut consulter la landing page, la page RGPD et les profils publics
  (si l'utilisateur les a activés et a publié des posts publics).

## Cas d'utilisation prioritaires

1. **UC4 — Créer un post** : flux principal, illustre le chiffrement client-side AES-256-GCM.
2. **UC10 — Changer la passphrase** : illustre la maintenance évolutive avec re-chiffrement
   transactionnel de tous les posts existants.
3. **UC13 — Consulter un profil public** : seule fonctionnalité accessible sans
   authentification, illustre la séparation contenu privé / public.
