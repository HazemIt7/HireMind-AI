import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/views/login_view.dart';
import '../features/auth/views/register_view.dart';
import '../features/auth/views/profile_setup_view.dart';
import '../features/home/views/home_view.dart';
import '../features/interview/views/interview_view.dart';

final GoRouter router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginView(),
    ),
    GoRoute(
      path: '/register',
      name: 'register',
      builder: (context, state) => const RegisterView(),
    ),
    GoRoute(
      path: '/profile-setup',
      name: 'profile-setup',
      builder: (context, state) => const ProfileSetupView(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeView(),
    ),
    GoRoute(
      path: '/interview/:sessionId',
      name: 'interview',
      builder: (context, state) {
        final sessionId = state.pathParameters['sessionId'] ?? '';
        return InterviewView(sessionId: sessionId);
      },
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    body: Center(
      child: Text('Page non trouvée : ${state.error}'),
    ),
  ),
);
