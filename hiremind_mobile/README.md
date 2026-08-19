# HireMind AI — Client Mobile Flutter

Ce projet constitue le client mobile multi-plateforme pour **HireMind AI** (Projet 1 / Stagiaire A du cahier des charges).
Il a été initialisé selon les principes de la **Clean Architecture** et du pattern **MVVM** (Model-View-ViewModel).

---

## 🛠️ Avancement Semaine 2 (Mobile Flutter)

Le Client Mobile a été complété pour les exigences de la Semaine 2 :
* **Authentification & Onboarding complet** :
  * Inscription (`RegisterView`), configuration de profil initial (`ProfileSetupView`) et connexion (`LoginView`).
  * Utilisation de jetons d'accès persistants.
* **Intégration d'API avec Dio** :
  * Liaison du dépôt de CV au service réel `/cv/upload` via `ApiService` et `CvRepository`.
* **Skill Passport dynamique** :
  * Intégration d'un `RadarChart` dynamique via `fl_chart` dessiné sur la page d'accueil.
  * Persistance à la connexion : les compétences et scores du passeport sont automatiquement récupérés à la connexion/rechargement sans avoir à réuploader le CV.

---

## 📁 Structure du Projet

```text
hiremind_mobile/
├── lib/
│   ├── data/
│   │   ├── repositories/    # Implémentations des dépôts (ex: AuthRepository)
│   │   └── services/        # Services réseau et API avec Dio (ex: ApiService)
│   ├── domain/
│   │   └── models/          # Modèles de données métier purs (ex: User)
│   ├── ui/
│   │   ├── core/            # Configuration globale, thème, routeur (GoRouter)
│   │   └── features/        # Fonctionnalités découpées par modules
│   │       ├── auth/        # Authentification (Views & ViewModels)
│   │       ├── home/        # Accueil, Passeport de compétences & Upload de CV
│   │       └── interview/   # Module d'entretien IA adaptatif (Vocal & Texte)
│   └── main.dart            # Point d'entrée de l'application
├── pubspec.yaml             # Dépendances (Dio, Provider, GoRouter, Audio, etc.)
└── README.md
```

---

## 🚀 Comment lancer le projet ?

Puisque les outils en ligne de commande Flutter/Dart n'étaient pas immédiatement configurés dans le terminal de l'environnement lors de l'initialisation, suivez ces étapes pour exécuter le projet sur votre machine locale :

1. **Installez Flutter & Dart SDK** (si ce n'est pas déjà fait) :
   * [Guide d'installation Flutter officiel](https://docs.flutter.dev/get-started/install)

2. **Générez les fichiers de plateforme manquants** :
   Dans le dossier `hiremind_mobile`, exécutez la commande suivante pour ajouter automatiquement les plateformes natives (Android, iOS, Web, Desktop) :
   ```bash
   flutter create .
   ```

3. **Récupérez les dépendances** :
   ```bash
   flutter pub get
   ```

4. **Lancez l'application** :
   * Pour démarrer sur un simulateur ou appareil connecté :
     ```bash
     flutter run
     ```

---

## 🔌 Intégration avec le Core Backend

L'application est préconfigurée pour envoyer ses requêtes sur :
`http://localhost:3000/api/v1`

Vous pouvez modifier cette adresse dans le fichier [lib/main.dart](file:///home/hazem/Desktop/stage/hiremind_mobile/lib/main.dart).
Les services réseau sont déclarés dans [lib/data/services/api_service.dart](file:///home/hazem/Desktop/stage/hiremind_mobile/lib/data/services/api_service.dart) et correspondent aux routes de la spécification [openapi.yaml](file:///home/hazem/Desktop/stage/api-spec/openapi.yaml).
