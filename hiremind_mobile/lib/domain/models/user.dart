class User {
  final String id;
  final String email;
  final String role;
  final String firstName;
  final String lastName;

  const User({
    required this.id,
    required this.email,
    required this.role,
    this.firstName = '',
    this.lastName = '',
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      role: json['role'] as String,
      firstName: (json['profile']?['firstName'] ?? '') as String,
      lastName: (json['profile']?['lastName'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'role': role,
      'profile': {
        'firstName': firstName,
        'lastName': lastName,
      },
    };
  }
}
