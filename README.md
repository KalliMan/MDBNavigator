# MDBnvigator Overiew

This is a sample fullstack demonstration application. The main purpose is to demonstrate various amount of technologies required for a modern Web development. Application allows user to connect to a Postgre DB and to perform basic DB operations. There are scripst for a composed dockerization. This is an ongoing project which is going to be enhanced in the future. 
<img width="2550" height="1234" alt="image" src="https://github.com/user-attachments/assets/95e61c83-e288-476a-9668-6248d23f6d29" />



If the result table recordset is huge then initially only a small portion is directly trnasfered from BE to the FE. The rest is transferred async using SignalR. The application design allows easy to implement further improvements like adding support for other DB servers.

## Main Projects 
### mdb-navigator-ui - React UI using vite.
    npm create vite@latest mdb-navigator-ui -- --template react-ts
   Technology stack: <br>
   **taiwlind** for styling. <br>
   **axios** for http requests. <br>
   **SignalR** for transferring huge amount of rows. <br>
   **context** React BuiltIn technology for managing the context. IMO better and lightweight than Redux, escpecially when there are many server calls.
   **react-toastify** for displaying inline messages.
   **monaco-editor** for SQL Editor.
### MDBNavigator.API - Backend base on .NET Core
  Technology stack:<br>
    **Middleware** For better exception handling (ExceptionMiddleware.) <br>
    **MemoryCache** For caching the connections. <br>
    **SignalRHub** For transferring large amount of data. <br>
    **BackgroundService** to handle sending data in background. <br>
    **Dapper** for database interaction. <br>
    **Automapper** to map different objects. <br>
    
# Run the Project locally.
  ### setup and install Postgre. The simplest solution is to install a docker image.
      docker pull postgres:14.5
      docker run --name TestPSDB -p 5432:5432  -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=secret -d postgres
  ### Run the BE
    (default port is 3001)
      
      https://localhost:3001;http://localhost:3002
  
  ### Run the FE
    npm run dev
  
Connect to Local: http://localhost:3000/. You should see the initial login screen. Default connection settings are hardcoded.
  
# Dockerization

## Docker. 2 Images have to be created for UI and BE. Dockerize settings:
    mdb-navigator-ui\Dockerfile
    MDBNavigator.API\Dockerfile
    docker-compose.yml
  
  ### (optional) Create cert for yml:<br>
      dotnet dev-certs https -ep "C:\Users\myuser\.aspnet\https\mdbnavigator.pfx" -p 123
      dotnet dev-certs https --trust
  
  ### Up to Docker Desktop & build and run <br>
      docker-compose up --build<br>

  ![image](https://github.com/user-attachments/assets/3ac9b61f-5a06-413c-9cee-b37b1cc2205f)

  ### (optional) Push to Docker repository<br>
      docker-compose push<br>

<br>
<br>

# In progress - for the next time ;) :

## Upload containers as stack to Azure
    az containerapp compose create -g ResourceGroup --environment ContainerappEnv  --compose-file-path docker-compose.yml
    
## Manualy Deploy. Important - use the **FallbackController**. <br>
  ### Create the build. Both must be into the same folder.
    dotnet publish -c Release -o ./bin/Publish<br>
    npm run build
    Compress-Archive -Path * -DestinationPath MdbNavigatorDeploy.zip -Force
    az webapp deploy --resource-group rg-manual-mdb-navigator --name manual-mdb-navigator --src-path .\MdbNavigatorDeploy.zip
    
