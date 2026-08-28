class JobOffer {
  final String id;
  final String title;
  final String department;
  final String description;
  final List<String> skillsRequired;
  final List<String> softSkills;
  final String salaryRange;
  final String location;
  final int candidateCount;
  final String? createdAt;
  final bool qdrantVectorIndexed;

  const JobOffer({
    required this.id,
    required this.title,
    required this.department,
    required this.description,
    required this.skillsRequired,
    this.softSkills = const [],
    required this.salaryRange,
    required this.location,
    this.candidateCount = 0,
    this.createdAt,
    this.qdrantVectorIndexed = true,
  });

  factory JobOffer.fromJson(Map<String, dynamic> json) {
    return JobOffer(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Offre d\'emploi',
      department: json['department']?.toString() ?? 'Technologie',
      description: json['description']?.toString() ?? '',
      skillsRequired: (json['skillsRequired'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      softSkills: (json['softSkills'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      salaryRange: json['salaryRange']?.toString() ?? 'Non précisé',
      location: json['location']?.toString() ?? 'Télétravail / Hybride',
      candidateCount: json['candidateCount'] is int ? json['candidateCount'] : 0,
      createdAt: json['createdAt']?.toString(),
      qdrantVectorIndexed: json['qdrantVectorIndexed'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'department': department,
      'description': description,
      'skillsRequired': skillsRequired,
      'softSkills': softSkills,
      'salaryRange': salaryRange,
      'location': location,
      'candidateCount': candidateCount,
      'createdAt': createdAt,
      'qdrantVectorIndexed': qdrantVectorIndexed,
    };
  }
}
