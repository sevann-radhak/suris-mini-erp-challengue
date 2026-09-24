namespace MiniErp.Core.Services;

public class NotFoundException(string message) : InvalidOperationException(message)
{
}
