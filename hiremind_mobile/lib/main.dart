import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'ui/core/router.dart';
import 'ui/features/auth/view_models/auth_view_model.dart';
import 'ui/features/home/view_models/home_view_model.dart';
import 'ui/features/interview/view_models/interview_view_model.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/cv_repository.dart';
import 'data/repositories/job_repository.dart';
import 'data/services/api_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late final ApiService apiService;
  late final AuthRepository authRepository;
  late final CvRepository cvRepository;
  late final JobRepository jobRepository;

  @override
  void initState() {
    super.initState();
    apiService = ApiService();
    authRepository = AuthRepository(apiService: apiService);
    cvRepository = CvRepository(apiService: apiService);
    jobRepository = JobRepository(apiService: apiService);
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>.value(value: apiService),
        Provider<AuthRepository>.value(value: authRepository),
        Provider<CvRepository>.value(value: cvRepository),
        Provider<JobRepository>.value(value: jobRepository),
        ChangeNotifierProvider(
          create: (_) => AuthViewModel(authRepository: authRepository),
        ),
        ChangeNotifierProvider(
          create: (_) => HomeViewModel(
            cvRepository: cvRepository,
            jobRepository: jobRepository,
          ),
        ),
        ChangeNotifierProvider(
          create: (_) => InterviewViewModel(apiService: apiService),
        ),
      ],
      child: MaterialApp.router(
        routerConfig: router,
        title: 'HireMind AI',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.blueAccent),
          useMaterial3: true,
          fontFamily: 'Roboto',
        ),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
