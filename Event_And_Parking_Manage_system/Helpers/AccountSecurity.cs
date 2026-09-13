using System.Security.Cryptography;

namespace Event_And_Parking_Manage_system.Helpers;

public static class AccountSecurity
{
    public static string NewOtp() => RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
    public static string NewToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
    public static int Minutes(IConfiguration config, string purpose) =>
        Math.Clamp(config.GetValue<int?>($"AccountSecurity:{purpose}Minutes") ?? 10, 1, 1440);
}
