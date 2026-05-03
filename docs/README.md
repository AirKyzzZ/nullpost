# Documentation NullPost, dossier BTS SIO E6

> Documentation technique du projet **NullPost**, réalisation professionnelle n° 1 du
> dossier de l'épreuve E6 du BTS SIO option SLAM, session 2026.

## Sommaire

| Document | Contenu |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Stack, architecture multi-couches Next.js, flux d'authentification OAuth, flux de chiffrement, schéma DB, routes API, sécurité, tests, CI/CD, déploiement |
| [`COMPETENCES.md`](COMPETENCES.md) | Mapping des trois compétences SLAM (Concevoir+dev, Maintenance, Gérer les données) avec preuves de code |
| [`SECURITE.md`](SECURITE.md) | Modèle de menace, chiffrement AES-256-GCM, OAuth 2.0, headers HTTP, RGPD |
| [`TESTS.md`](TESTS.md) | Stratégie de tests (Vitest unitaires, intégration, Playwright E2E), couverture, CI |
| [`ACCES_JURY.md`](ACCES_JURY.md) | URL de démo, parcours suggéré, captures, comment tester en local |
| [`uml/`](uml/) | Diagrammes Mermaid : cas d'utilisation, séquences (auth, post), classes, déploiement, ERD |

## Parcours suggéré pour le jury

1. Lire le **[README principal](../README.md)** pour la vision produit (5 min).
2. Tester la démo en ligne : <https://nullpost.maximemansiet.fr> via [`ACCES_JURY.md`](ACCES_JURY.md).
3. Survoler l'**[architecture](ARCHITECTURE.md)** pour comprendre le flux de chiffrement (10 min).
4. Consulter le **[mapping des compétences](COMPETENCES.md)** (10 min).
5. Vérifier la **[sécurité](SECURITE.md)** et les **[tests](TESTS.md)** (5 min chacun).
6. Naviguer les **[diagrammes UML](uml/)** selon les questions du jury.

## Liens externes

- **Démo en production** : <https://nullpost.maximemansiet.fr>
- **Code source** : <https://github.com/AirKyzzZ/nullpost> (licence AGPL-3.0)
- **Suivi des problèmes** : <https://github.com/AirKyzzZ/nullpost/issues>
- **CI** : <https://github.com/AirKyzzZ/nullpost/actions>
- **Auteur** : Maxime Mansiet, <https://maximemansiet.fr>
