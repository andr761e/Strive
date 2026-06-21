import Capacitor
import UIKit
import UserNotifications
import WebKit

class MainViewController: CAPBridgeViewController {
    private let striveNotificationBridge = StriveNotificationBridge()

    override func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        striveNotificationBridge.install(in: configuration.userContentController)
        return configuration
    }

    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        striveNotificationBridge.activate()
    }
}

private final class StriveNotificationBridge: NSObject, WKScriptMessageHandler, UNUserNotificationCenterDelegate {
    private static let scriptMessageName = "StriveNotifications"
    private static let reminderStoreKey = "strive_native_ios_reminders"
    private static let activeWorkoutIdentifier = "strive_active_workout"

    private let notificationCenter = UNUserNotificationCenter.current()
    private let userDefaults = UserDefaults.standard

    func install(in userContentController: WKUserContentController) {
        let source = """
        (function () {
          if (window.StriveNotifications) return;

          function post(type, payload) {
            window.webkit.messageHandlers.StriveNotifications.postMessage(Object.assign({ type: type }, payload || {}));
          }

          window.StriveNotifications = {
            requestPostNotificationsPermission: function () {
              post('requestPostNotificationsPermission');
            },
            scheduleWorkoutReminders: function (reminders) {
              post('scheduleWorkoutReminders', { reminders: reminders });
            },
            cancelWorkoutReminders: function (workoutId) {
              post('cancelWorkoutReminders', { workoutId: workoutId || '' });
            },
            startActiveWorkoutNotification: function (payload) {
              post('startActiveWorkoutNotification', { payload: payload });
            },
            updateActiveWorkoutNotification: function (payload) {
              post('updateActiveWorkoutNotification', { payload: payload });
            },
            stopActiveWorkoutNotification: function () {
              post('stopActiveWorkoutNotification');
            }
          };
        })();
        """

        let userScript = WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        userContentController.addUserScript(userScript)
        userContentController.add(self, name: Self.scriptMessageName)
    }

    func activate() {
        notificationCenter.delegate = self
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.scriptMessageName,
              let body = message.body as? [String: Any],
              let type = body["type"] as? String else {
            return
        }

        switch type {
        case "requestPostNotificationsPermission":
            requestPostNotificationsPermission()
        case "scheduleWorkoutReminders":
            let reminders = body["reminders"] as? [[String: Any]] ?? []
            scheduleWorkoutReminders(reminders)
        case "cancelWorkoutReminders":
            cancelWorkoutReminders(workoutId: body["workoutId"] as? String)
        case "startActiveWorkoutNotification", "updateActiveWorkoutNotification":
            if let payload = body["payload"] as? [String: Any] {
                showActiveWorkoutNotification(payload)
            }
        case "stopActiveWorkoutNotification":
            stopActiveWorkoutNotification()
        default:
            break
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        if notification.request.identifier == Self.activeWorkoutIdentifier {
            completionHandler([.list])
            return
        }

        completionHandler([.banner, .list, .sound])
    }

    private func requestPostNotificationsPermission(completion: (() -> Void)? = nil) {
        notificationCenter.requestAuthorization(options: [.alert, .badge, .sound]) { _, _ in
            completion?()
        }
    }

    private func scheduleWorkoutReminders(_ reminderDictionaries: [[String: Any]]) {
        let reminders = reminderDictionaries.compactMap(StoredWorkoutReminder.init(dictionary:))
        requestPostNotificationsPermission { [weak self] in
            guard let self else { return }

            let now = Date()
            let futureReminders = reminders.filter { $0.fireDate > now }
            futureReminders.forEach { self.scheduleWorkoutReminder($0) }
        }
    }

    private func scheduleWorkoutReminder(_ reminder: StoredWorkoutReminder) {
        var content = UNMutableNotificationContent()
        content.title = reminder.title.isEmpty ? "Time to train" : reminder.title
        content.body = reminder.body.isEmpty ? "Open Strive and log your next workout." : reminder.body
        content.sound = .default
        content.categoryIdentifier = "workoutReminder"
        content.threadIdentifier = "strive_workout_reminders"
        content.interruptionLevel = .active

        let interval = max(1, reminder.fireDate.timeIntervalSinceNow)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        let request = UNNotificationRequest(identifier: reminder.id, content: content, trigger: trigger)

        notificationCenter.add(request)
        saveReminder(reminder)
    }

    private func cancelWorkoutReminders(workoutId: String?) {
        let storedReminders = readStoredReminders()
        let shouldCancelAll = workoutId?.isEmpty ?? true
        let cancelledReminders = storedReminders.filter { shouldCancelAll || $0.workoutId == workoutId }
        let keptReminders = storedReminders.filter { reminder in
            !cancelledReminders.contains(where: { $0.id == reminder.id })
        }
        let cancelledIds = cancelledReminders.map(\.id)

        notificationCenter.removePendingNotificationRequests(withIdentifiers: cancelledIds)
        notificationCenter.removeDeliveredNotifications(withIdentifiers: cancelledIds)
        writeStoredReminders(keptReminders)
    }

    private func showActiveWorkoutNotification(_ payload: [String: Any]) {
        requestPostNotificationsPermission { [weak self] in
            self?.scheduleActiveWorkoutNotification(payload)
        }
    }

    private func scheduleActiveWorkoutNotification(_ payload: [String: Any]) {
        let workoutName = nonEmptyString(payload["workoutName"]) ?? "Workout"
        let elapsedSeconds = getElapsedSeconds(from: payload)
        let restTimer = payload["restTimer"] as? [String: Any]
        let restExerciseName = nonEmptyString(restTimer?["exerciseName"])
        let restRemainingSeconds = getRestRemainingSeconds(from: restTimer)
        let hasRestTimer = restRemainingSeconds > 0

        var content = UNMutableNotificationContent()
        content.title = hasRestTimer ? "Rest \(formatDuration(restRemainingSeconds))" : "Workout active"
        content.body = hasRestTimer
            ? "\(workoutName) - workout \(formatDuration(elapsedSeconds)) - \(restExerciseName ?? "Rest timer")"
            : "\(workoutName) - timer running"
        content.categoryIdentifier = "activeWorkout"
        content.threadIdentifier = "strive_active_workout"
        content.interruptionLevel = .passive

        notificationCenter.removePendingNotificationRequests(withIdentifiers: [Self.activeWorkoutIdentifier])
        notificationCenter.removeDeliveredNotifications(withIdentifiers: [Self.activeWorkoutIdentifier])
        notificationCenter.add(UNNotificationRequest(identifier: Self.activeWorkoutIdentifier, content: content, trigger: nil))
    }

    private func stopActiveWorkoutNotification() {
        notificationCenter.removePendingNotificationRequests(withIdentifiers: [Self.activeWorkoutIdentifier])
        notificationCenter.removeDeliveredNotifications(withIdentifiers: [Self.activeWorkoutIdentifier])
    }

    private func getElapsedSeconds(from payload: [String: Any]) -> Int {
        let fallback = max(0, intValue(payload["elapsedSeconds"]) ?? 0)
        guard let startedAt = nonEmptyString(payload["startedAt"]),
              let startedAtDate = parseDate(startedAt) else {
            return fallback
        }

        let elapsed = Int(Date().timeIntervalSince(startedAtDate))
        return max(fallback, elapsed)
    }

    private func getRestRemainingSeconds(from restTimer: [String: Any]?) -> Int {
        guard let endsAtMs = doubleValue(restTimer?["endsAt"]), endsAtMs > 0 else {
            return 0
        }

        let remaining = (endsAtMs / 1000) - Date().timeIntervalSince1970
        return max(0, Int(ceil(remaining)))
    }

    private func saveReminder(_ reminder: StoredWorkoutReminder) {
        var reminders = readStoredReminders().filter { $0.id != reminder.id }
        reminders.append(reminder)
        writeStoredReminders(reminders)
    }

    private func readStoredReminders() -> [StoredWorkoutReminder] {
        guard let data = userDefaults.data(forKey: Self.reminderStoreKey) else {
            return []
        }

        return (try? JSONDecoder().decode([StoredWorkoutReminder].self, from: data)) ?? []
    }

    private func writeStoredReminders(_ reminders: [StoredWorkoutReminder]) {
        guard let data = try? JSONEncoder().encode(reminders) else {
            return
        }

        userDefaults.set(data, forKey: Self.reminderStoreKey)
    }

    private func nonEmptyString(_ value: Any?) -> String? {
        guard let string = value as? String else {
            return nil
        }

        let trimmed = string.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func intValue(_ value: Any?) -> Int? {
        if let int = value as? Int {
            return int
        }

        if let double = value as? Double {
            return Int(double)
        }

        if let number = value as? NSNumber {
            return number.intValue
        }

        return nil
    }

    private func doubleValue(_ value: Any?) -> Double? {
        if let double = value as? Double {
            return double
        }

        if let int = value as? Int {
            return Double(int)
        }

        if let number = value as? NSNumber {
            return number.doubleValue
        }

        return nil
    }

    private func parseDate(_ value: String) -> Date? {
        let fractionalFormatter = ISO8601DateFormatter()
        fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractionalFormatter.date(from: value) {
            return date
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: value)
    }

    private func formatDuration(_ totalSeconds: Int) -> String {
        let safeSeconds = max(0, totalSeconds)
        let hours = safeSeconds / 3600
        let minutes = (safeSeconds % 3600) / 60
        let seconds = safeSeconds % 60

        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, seconds)
        }

        return String(format: "%d:%02d", minutes, seconds)
    }
}

private struct StoredWorkoutReminder: Codable {
    let id: String
    let userId: String
    let workoutId: String
    let workoutName: String
    let hoursAfterWorkout: Double
    let fireAt: String
    let title: String
    let body: String

    var fireDate: Date {
        let fractionalFormatter = ISO8601DateFormatter()
        fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractionalFormatter.date(from: fireAt) {
            return date
        }

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: fireAt) ?? Date.distantPast
    }

    init?(dictionary: [String: Any]) {
        guard let id = dictionary["id"] as? String,
              let userId = dictionary["userId"] as? String,
              let workoutId = dictionary["workoutId"] as? String,
              let workoutName = dictionary["workoutName"] as? String,
              let fireAt = dictionary["fireAt"] as? String else {
            return nil
        }

        self.id = id
        self.userId = userId
        self.workoutId = workoutId
        self.workoutName = workoutName
        self.hoursAfterWorkout = StoredWorkoutReminder.doubleValue(dictionary["hoursAfterWorkout"]) ?? 0
        self.fireAt = fireAt
        self.title = dictionary["title"] as? String ?? "Time to train"
        self.body = dictionary["body"] as? String ?? "Open Strive and log your next workout."
    }

    private static func doubleValue(_ value: Any?) -> Double? {
        if let double = value as? Double {
            return double
        }

        if let int = value as? Int {
            return Double(int)
        }

        if let number = value as? NSNumber {
            return number.doubleValue
        }

        return nil
    }
}
