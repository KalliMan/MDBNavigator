using Models.Connect;

namespace MDBNavigator.DAL.Interfaces
{
    public interface IDBServerFactory
    {
        IDBServerBase Create(ConnectionSettings details);
    }
}