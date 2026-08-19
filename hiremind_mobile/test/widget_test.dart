// Test widget de base pour HireMind AI.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hiremind_mobile/main.dart';

void main() {
  testWidgets('Smoke test - Chargement de l\'écran de connexion', (WidgetTester tester) async {
    // Construire notre application et déclencher un frame.
    await tester.pumpWidget(const MyApp());

    // Attendre que la navigation et les dépendances s'initialisent.
    await tester.pumpAndSettle();

    // Vérifier que l'application affiche le titre de connexion "HireMind AI".
    expect(find.text('HireMind AI'), findsOneWidget);
    expect(find.text('Plateforme SaaS de Recrutement IA'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Se connecter'), findsOneWidget);
  });
}
