import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:file_picker/file_picker.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../../data/repositories/auth_repository.dart';
import '../../../../domain/models/job_offer.dart';
import '../../interview/view_models/interview_view_model.dart';
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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HomeViewModel>().fetchPassport();
      context.read<HomeViewModel>().fetchJobs();
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

  void _startInterviewForJob(JobOffer job) {
    final user = context.read<AuthRepository>().currentUser;
    final interviewVm = context.read<InterviewViewModel>();
    final candName = (user != null && user.firstName.isNotEmpty)
        ? '${user.firstName} ${user.lastName}'.trim()
        : 'Alexandre Dubois';
    final candId = user?.id ?? 'cand_alexandre_dubois';

    interviewVm.startInterview(
      job: job,
      candidateName: candName,
      candidateId: candId,
    );
    context.pushNamed(
      'interview',
      pathParameters: {'sessionId': job.id},
    );
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
            icon: const Icon(Icons.refresh_rounded, color: Colors.blueAccent),
            tooltip: 'Actualiser les données',
            onPressed: () {
              viewModel.fetchPassport();
              viewModel.fetchJobs();
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Colors.blueAccent),
            tooltip: 'Se déconnecter',
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
            // Bienvenue Card
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bonjour, ${user?.firstName.isNotEmpty == true ? user!.firstName : "Candidat"} 👋',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: Colors.black87,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? 'candidate@hiremind.ai',
                        style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                CircleAvatar(
                  radius: 26,
                  backgroundColor: Colors.blueAccent.withValues(alpha: 0.1),
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
            const SizedBox(height: 20),

            // Section Suivi Candidat & Pipeline ATS
            _buildPipelineStatusCard(viewModel),
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
                            color: Colors.blueAccent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.description_outlined,
                            color: Colors.blueAccent,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'Dépôt de CV & Analyse IA',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Déposez votre CV au format PDF pour analyser vos compétences et générer votre passeport radar IA.',
                      style: TextStyle(color: Colors.grey, fontSize: 13, height: 1.3),
                    ),
                    const SizedBox(height: 16),
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
                          'Sélectionner mon CV (PDF)',
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
                            color: Colors.green.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline, color: Colors.green, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Fichier chargé : ${viewModel.cvPath!.split('/').last}',
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
            const SizedBox(height: 24),

            // Section Passeport de compétences
            const Text(
              'Votre Skill Passport IA',
              style: TextStyle(
                fontSize: 19,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 12),
            _buildRadarPassportSection(viewModel),
            const SizedBox(height: 24),

            // Section Données Extraites du CV
            if (viewModel.parsedCvData != null) ...[
              const Text(
                'Compétences Extraites par l\'IA 🧠',
                style: TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              _buildParsedCvDataCard(viewModel.parsedCvData!),
              const SizedBox(height: 24),
            ],

            // Section Offres d'emploi & Entretiens IA Dynamiques
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Offres & Entretiens IA 🎯',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                Text(
                  '${viewModel.jobOffers.length} offre(s)',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey[600]),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildJobsListSection(viewModel),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildPipelineStatusCard(HomeViewModel viewModel) {
    final hasPassport = viewModel.radarScores != null && viewModel.radarScores!.isNotEmpty;
    final statusLabel = hasPassport ? 'Évaluation IA Validée' : 'En attente de CV';
    final statusColor = hasPassport ? Colors.green : Colors.orange;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              hasPassport ? Icons.verified_user_rounded : Icons.pending_actions_rounded,
              color: statusColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Statut du Dossier ATS',
                  style: TextStyle(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 2),
                Text(
                  statusLabel,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRadarPassportSection(HomeViewModel viewModel) {
    if (viewModel.isLoadingPassport) {
      return Container(
        height: 240,
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
            Icon(Icons.radar_rounded, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 12),
            const Text(
              'Passeport non généré',
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
          SizedBox(
            height: 220,
            child: RadarChart(
              RadarChartData(
                dataSets: [
                  RadarDataSet(
                    dataEntries: scores
                        .map((e) => RadarEntry(value: (e['score'] as num).toDouble()))
                        .toList(),
                    borderColor: Colors.blueAccent,
                    fillColor: Colors.blueAccent.withValues(alpha: 0.12),
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
                    final item = scores[index];
                    final label = (item['label'] ?? item['axis'] ?? 'Axe').toString();
                    return RadarChartTitle(text: label);
                  }
                  return const RadarChartTitle(text: '');
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: scores.map((e) {
              final label = (e['label'] ?? e['axis'] ?? 'Axe').toString();
              return Chip(
                avatar: CircleAvatar(
                  backgroundColor: Colors.blueAccent,
                  child: Text(
                    '${e['score']}',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
                label: Text(
                  label,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                backgroundColor: Colors.blueAccent.withValues(alpha: 0.05),
                side: BorderSide(color: Colors.blueAccent.withValues(alpha: 0.2)),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildJobsListSection(HomeViewModel viewModel) {
    if (viewModel.isLoadingJobs) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (viewModel.jobOffers.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Column(
          children: [
            Icon(Icons.work_off_outlined, size: 48, color: Colors.grey[400]),
            const SizedBox(height: 12),
            const Text(
              'Aucune offre d\'emploi disponible',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 4),
            const Text(
              'Les offres publiées par les recruteurs apparaîtront ici avec possibilité de passer l\'entretien IA.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      );
    }

    return Column(
      children: viewModel.jobOffers.map((job) {
        return Card(
          elevation: 0,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.grey.shade200),
          ),
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.blueAccent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.work_outline, color: Colors.blueAccent, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            job.title,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${job.department} • ${job.location}',
                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (job.description.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text(
                    job.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey[700], fontSize: 13, height: 1.3),
                  ),
                ],
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: job.skillsRequired.take(4).map((skill) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Text(
                        skill,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      job.salaryRange,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.green),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _startInterviewForJob(job),
                      icon: const Icon(Icons.play_arrow_rounded, size: 18),
                      label: const Text(
                        'Passer l\'Entretien IA',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        backgroundColor: Colors.blueAccent,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
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
            if (identity != null) ...[
              Text(
                identity['fullName'] ?? '',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.email_outlined, size: 15, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(identity['email'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(width: 16),
                  const Icon(Icons.phone_outlined, size: 15, color: Colors.grey),
                  const SizedBox(width: 6),
                  Text(identity['phone'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
              const Divider(height: 24),
            ],
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
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: list.map((e) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: color.withValues(alpha: 0.2)),
              ),
              child: Text(
                e.toString(),
                style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w600),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
