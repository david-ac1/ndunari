/// User preferences model
class UserPreferences {
  final String preferredLanguage; // 'english', 'pidgin', 'hausa', 'igbo', 'yoruba'
  final bool notificationsEnabled;
  final bool locationPermissionGranted;
  final bool isFirstTime;
  final DateTime lastUsed;

  UserPreferences({
    this.preferredLanguage = 'english',
    this.notificationsEnabled = true,
    this.locationPermissionGranted = false,
    this.isFirstTime = true,
    DateTime? lastUsed,
  }) : lastUsed = lastUsed ?? DateTime.now();

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      preferredLanguage: json['preferred_language'] ?? 'english',
      notificationsEnabled: json['notifications_enabled'] ?? true,
      locationPermissionGranted: json['location_permission_granted'] ?? false,
      isFirstTime: json['is_first_time'] ?? true,
      lastUsed: json['last_used'] != null
          ? DateTime.parse(json['last_used'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'preferred_language': preferredLanguage,
      'notifications_enabled': notificationsEnabled,
      'location_permission_granted': locationPermissionGranted,
      'is_first_time': isFirstTime,
      'last_used': lastUsed.toIso8601String(),
    };
  }

  UserPreferences copyWith({
    String? preferredLanguage,
    bool? notificationsEnabled,
    bool? locationPermissionGranted,
    bool? isFirstTime,
    DateTime? lastUsed,
  }) {
    return UserPreferences(
      preferredLanguage: preferredLanguage ?? this.preferredLanguage,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      locationPermissionGranted:
          locationPermissionGranted ?? this.locationPermissionGranted,
      isFirstTime: isFirstTime ?? this.isFirstTime,
      lastUsed: lastUsed ?? this.lastUsed,
    );
  }
}
