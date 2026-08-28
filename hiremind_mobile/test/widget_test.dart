import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hiremind_mobile/main.dart';
import 'package:hiremind_mobile/domain/models/job_offer.dart';

void main() {
  testWidgets('Smoke test - Chargement de l\'écran de connexion', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());
    await tester.pumpAndSettle();

    // Vérifier que l'application affiche le titre de connexion "HireMind AI".
    expect(find.text('HireMind AI'), findsOneWidget);
    expect(find.text('Espace Mobile Candidat • IA Recrutement'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Se connecter'), findsOneWidget);
    expect(find.text('Remplir avec Compte Démo Candidat'), findsOneWidget);
  });

  test('Unit test - Model JobOffer parsing', () {
    final json = {
      'id': 'job_test_01',
      'title': 'Ingénieur Cloud & DevOps',
      'department': 'Infrastructure',
      'description': 'Poste DevOps CI/CD Kubernetes',
      'skillsRequired': ['Kubernetes', 'Docker', 'Terraform'],
      'salaryRange': '55k - 65k',
      'location': 'Paris',
      'candidateCount': 3,
      'qdrantVectorIndexed': true,
    };

    final job = JobOffer.fromJson(json);
    expect(job.id, 'job_test_01');
    expect(job.title, 'Ingénieur Cloud & DevOps');
    expect(job.skillsRequired.length, 3);
    expect(job.skillsRequired, contains('Kubernetes'));
  });
}
