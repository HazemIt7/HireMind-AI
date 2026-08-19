import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../data/repositories/auth_repository.dart';
import '../view_models/home_view_model.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  @override
  void initState() {
    super.initState();
    // Retrieve passport scores on view initialization if they exist
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeViewModel>().fetchPassport();
    });
  }

  Future<void> _pickAndUploadCV() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'docx', 'txt'],
    );

    if (result != null && result.files.single.path != null) {
      if (mounted) {
        await context.read<HomeViewModel>().uploadCV(result.files.single.path!);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authRepository = context.read<AuthRepository>();
    final user = authRepository.currentUser;
    final viewModel = context.watch<HomeViewModel>();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'HireMind AI',
          style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: -0.5),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black87,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.blueAccent),
            onPressed: () async {
              final router = GoRouter.of(context);
              await authRepository.logout();
              viewModel.reset();
              if (!mounted) return;
              router.goNamed('login');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Bienvenue
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bonjour, ${user?.firstName ?? "Candidat"} 👋',
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                          color: Colors.black87,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? 'candidate@hiremind.ai',
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.blueAccent.withOpacity(0.1),
                  child: Text(
                    (user?.firstName.isNotEmpty == true)
                        ? user!.firstName[0].toUpperCase()
                        : 'C',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.blueAccent,
                    ),
                  ),
                )
              ],
            ),
            const SizedBox(height: 24),

            // Section Dépôt de CV
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.grey.shade200, width: 1.5),
              ),
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.blueAccent.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.description_outlined,
                            color: Colors.blueAccent,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Dépôt de Candidature',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Importez votre CV (PDF, DOCX) pour mettre à jour votre Passeport de compétences IA.',
                      style: TextStyle(color: Colors.grey, fontSize: 14, height: 1.3),
                    ),
                    const SizedBox(height: 20),
                    if (viewModel.isUploading)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12.0),
                          child: Column(
                            children: [
                              const CircularProgressIndicator(
                                strokeWidth: 3,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.blueAccent),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                viewModel.uploadStatus ?? 'Traitement en cours...',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blueAccent,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    else ...[
                      ElevatedButton.icon(
                        onPressed: _pickAndUploadCV,
                        icon: const Icon(Icons.cloud_upload_outlined),
                        label: const Text(
                          'Sélectionner un fichier',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          backgroundColor: Colors.blueAccent,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      if (viewModel.cvPath != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.green.withOpacity(0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline, color: Colors.green, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Chargé : ${viewModel.cvPath!.split('/').last}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: Colors.green,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      if (viewModel.errorMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          viewModel.errorMessage!,
                          style: const TextStyle(color: Colors.red, fontSize: 13),
                        ),
                      ]
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Section Passeport de compétences
            const Text(
              'Votre Skill Passport IA',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            _buildRadarPassportSection(viewModel),
            const SizedBox(height: 28),

            // Section Données Extraites du CV
            if (viewModel.parsedCvData != null) ...[
              const Text(
                'Données extraites par l\'IA 🧠',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              _buildParsedCvDataCard(viewModel.parsedCvData!),
              const SizedBox(height: 28),
            ],

            // Section Entretiens
            const Text(
              'Évaluation & Entretiens IA',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              color: Colors.white,
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.purple.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.code_rounded, color: Colors.purple),
                ),
                title: const Text(
                  'Développeur Flutter / Dart',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                subtitle: const Padding(
                  padding: EdgeInsets.only(top: 4.0),
                  child: Text('Entretien technique & vocal adaptatif'),
                ),
                trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey),
                onTap: () {
                  context.pushNamed(
                    'interview',
                    pathParameters: {'sessionId': 'session_128937'},
                  );
                },
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildRadarPassportSection(HomeViewModel viewModel) {
    if (viewModel.isLoadingPassport) {
      return Container(
        height: 280,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final scores = viewModel.radarScores;
    if (scores == null || scores.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200, width: 1.5),
        ),
        child: Column(
          children: [
            Icon(Icons.radar_rounded, size: 56, color: Colors.grey[400]),
            const SizedBox(height: 12),
            const Text(
              'Aucune donnée de compétences',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 6),
            const Text(
              'Déposez votre CV ci-dessus pour générer votre cartographie radar de compétences IA.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.3),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          // Radar chart
          SizedBox(
            height: 230,
            child: RadarChart(
              RadarChartData(
                dataSets: [
                  RadarDataSet(
                    dataEntries: scores
                        .map((e) => RadarEntry(value: (e['score'] as num).toDouble()))
                        .toList(),
                    borderColor: Colors.blueAccent,
                    fillColor: Colors.blueAccent.withOpacity(0.12),
                    borderWidth: 2.5,
                    entryRadius: 4,
                  ),
                ],
                radarBorderData: BorderSide(color: Colors.grey.shade300, width: 1),
                gridBorderData: BorderSide(color: Colors.grey.shade200, width: 1),
                tickBorderData: BorderSide(color: Colors.grey.shade200, width: 1),
                ticksTextStyle: TextStyle(color: Colors.grey[400], fontSize: 9),
                tickCount: 4,
                getTitle: (index, angle) {
                  if (index >= 0 && index < scores.length) {
                    return RadarChartTitle(
                      text: scores[index]['axis'] as String,
                    );
                  }
                  return const RadarChartTitle(text: '');
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Legend/List of scores
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: scores.map((e) {
              return Chip(
                avatar: CircleAvatar(
                  backgroundColor: Colors.blueAccent,
                  child: Text(
                    '${e['score']}',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
                label: Text(
                  e['axis'] as String,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                backgroundColor: Colors.blueAccent.withOpacity(0.05),
                side: BorderSide(color: Colors.blueAccent.withOpacity(0.2)),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildParsedCvDataCard(Map<String, dynamic> data) {
    final identity = data['identity'] as Map<String, dynamic>?;
    final skills = data['skills'] as Map<String, dynamic>?;
    final technical = skills?['technical'] as List<dynamic>? ?? [];
    final methodological = skills?['methodological'] as List<dynamic>? ?? [];
    final softSkills = skills?['softSkills'] as List<dynamic>? ?? [];

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Name & Contacts
            if (identity != null) ...[
              Text(
                identity['fullName'] ?? '',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.email_outlined, size: 16, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(identity['email'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                  const SizedBox(width: 16),
                  const Icon(Icons.phone_outlined, size: 16, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(identity['phone'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 13)),
                ],
              ),
              const Divider(height: 24),
            ],

            // Skills subsections
            _buildSkillsSubsection('Compétences Techniques', technical, Colors.blue),
            const SizedBox(height: 14),
            _buildSkillsSubsection('Méthodologies', methodological, Colors.orange),
            const SizedBox(height: 14),
            _buildSkillsSubsection('Soft Skills', softSkills, Colors.green),
          ],
        ),
      ),
    );
  }

  Widget _buildSkillsSubsection(String title, List<dynamic> list, Color color) {
    if (list.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: list.map((e) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: color.withOpacity(0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: color.withOpacity(0.2)),
              ),
              child: Text(
                e.toString(),
                style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
