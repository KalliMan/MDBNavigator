import { HubConnection, HubConnectionBuilder, LogLevel, Subject } from '@microsoft/signalr';
import LocalSessionStorage from '../utils/localSessionStorage';

class BatchCommandResultSignalR {
    connection: HubConnection | null = null;
    public $onBatchCommandResultSignalR: Subject<string> = new Subject<string>();

    constructor() {
    }

    connect() {
      const appId = LocalSessionStorage.getApplicationId();
      
      this.connection = new HubConnectionBuilder()
        .withUrl('https://localhost:7262/batchCommandResult?commandId=' + appId)
        .withAutomaticReconnect()
        .configureLogging(LogLevel.Information)
        .build();

        this.connection!
          .start()
          .catch(err => console.error(err))
          .then(() => console.log('Connection started!'));

        this.connection!.on('ReceiveBatchCommandResult', (message) => {
          console.log(message);
        });
    }

    disconnect() {
      if (this.connection) {
        this.connection.stop();        
      }
    }
}

const batchCommandResultSignalR = new BatchCommandResultSignalR();
export default batchCommandResultSignalR;
export const $onBatchCommandResultSignalR = batchCommandResultSignalR.$onBatchCommandResultSignalR;

