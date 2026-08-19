import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';

class InterviewView extends StatefulWidget {
  final String sessionId;
  const InterviewView({super.key, required this.sessionId});

  @override
  State<InterviewView> createState() => _InterviewViewState();
}

class _InterviewViewState extends State<InterviewView> {
  final _record = AudioRecorder();
  final _audioPlayer = AudioPlayer();
  bool _isRecording = false;
  final String _currentQuestion =
      "Bonjour ! Pouvez-vous me présenter vos expériences marquantes en développement d'applications avec Flutter ?";
  final List<Map<String, String>> _messages = [];
  final _textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Message d'introduction de l'IA
    _messages.add({'sender': 'ia', 'text': _currentQuestion});
  }

  @override
  void dispose() {
    _record.dispose();
    _audioPlayer.dispose();
    _textController.dispose();
    super.dispose();
  }

  Future<void> _toggleRecording() async {
    if (_isRecording) {
      final path = await _record.stop();
      setState(() {
        _isRecording = false;
      });
      if (path != null) {
        // Simuler le traitement de la voix par Whisper STT et la réponse IA
        _sendVoiceMessage(path);
      }
    } else {
      if (await _record.hasPermission()) {
        await _record.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: 'temp_record.m4a',
        );
        setState(() {
          _isRecording = true;
        });
      }
    }
  }

  void _sendTextMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'sender': 'user', 'text': text});
      _textController.clear();
    });

    _simulateResponse(text);
  }

  void _sendVoiceMessage(String path) {
    setState(() {
      _messages.add({'sender': 'user', 'text': '[Réponse Vocale Envoyée 🎙️]'});
    });
    _simulateResponse("Réponse vocale reçue");
  }

  Future<void> _simulateResponse(String userText) async {
    // Simuler le délai de réflexion du backend NestJS et de l'IA
    await Future.delayed(const Duration(seconds: 2));
    setState(() {
      _messages.add({
        'sender': 'ia',
        'text': 'Merci pour votre réponse. Pouvez-vous expliquer comment vous configurez la Clean Architecture sur vos projets Flutter ?',
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Entretien IA Adaptatif'),
      ),
      body: Column(
        children: [
          // Historique des messages
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isIA = message['sender'] == 'ia';
                return Align(
                  alignment: isIA ? Alignment.centerLeft : Alignment.centerRight,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 6.0),
                    padding: const EdgeInsets.all(14.0),
                    decoration: BoxDecoration(
                      color: isIA ? Colors.blueGrey[100] : Colors.blueAccent,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(16),
                        topRight: const Radius.circular(16),
                        bottomLeft: isIA ? Radius.zero : const Radius.circular(16),
                        bottomRight: isIA ? const Radius.circular(16) : Radius.zero,
                      ),
                    ),
                    child: Text(
                      message['text'] ?? '',
                      style: TextStyle(
                        color: isIA ? Colors.black87 : Colors.white,
                        fontSize: 15,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Zone d'action (Enregistrement Vocal & Envoi de Texte)
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Column(
              children: [
                // Enregistrement vocal
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    FloatingActionButton.large(
                      onPressed: _toggleRecording,
                      backgroundColor: _isRecording ? Colors.red : Colors.blueAccent,
                      child: Icon(
                        _isRecording ? Icons.stop : Icons.mic,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  _isRecording
                      ? "Enregistrement de votre réponse... Appuyez sur STOP pour envoyer."
                      : "Maintenez ou cliquez sur le micro pour parler",
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 16),

                // Saisie de texte alternative
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        decoration: const InputDecoration(
                          hintText: 'Ou répondez par écrit...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(24.0)),
                          ),
                          contentPadding: EdgeInsets.symmetric(horizontal: 16.0),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.send, color: Colors.blueAccent),
                      onPressed: _sendTextMessage,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
