# MDBnvigator Overciew

This is a sample fullstack demonstration application. The main purpose is to demonstrate various amount of technologies required for a modern Web development. It allows user to connect to a Postgre DB  and to perform basic DB operations. This is ongoing project which is going to be enchanced further. 
![image](https://github.com/user-attachments/assets/f60fa6e3-5774-4699-bee8-3ecabb15ceb1)

If the result table data is huge then only a small portion is directly trnasfered from BE to the FE. The rest is transfered async using SignalR. The application design allows easy to mimplement further improvements like adding support for other DB servers.

## Main Projects 
### mdb-navigator-ui - React UI using vite.
    npm create vite@latest mdb-navigator-ui -- --template react-ts
   Other technologies: <br>
   **taiwlind** for styling. <br>
   **axios** for http requests. <br>
   **SignalR** for transferring huge amount of rows. <br>
   **context** React BuiltIn technology for managing the context. IMO much better and lightweight than Redux. Escpecially when there are many server calls.
   **react-toastify** for displaying inline messages.
### MDBNavigator.API - Backend base on .NET Core
  Technologies:<br>
    **Middleware** For better exception handling (ExceptionMiddleware.) <br>
    **MemoryCache** For caching the connections. <br>
    **SignalRHub** For transferring large amount of data. <br>
    **BackgroundService** to handle sending data in background. <br>
    **Dapper** for database interaction. <br>
    **Automapper** to map different objects. <br>
    
# Run the Project locally.
  ### setup and install Postgre. The simplest solution is to install a docker image.
  ### Run the BE
  ### Run the FE
    npm run dev
  
Connect to Local: http://localhost:3000/. You should see the initial login screen.
  
# Dockerizing

## Docker. 2 Images have to be created for UI and BE. Dockerize files:
    mdb-navigator-ui\Dockerfile
    MDBNavigator.API\Dockerfile
    docker-compose.yml
  
  ### Create cert for yml:<br>
      dotnet dev-certs https -ep "C:\Users\myuser\.aspnet\https\mdbnavigator.pfx" -p 123<br>
  
  ### Up to Docker Desctop & build and run <br>
      docker-compose up --build<br>
  
  ### Push to Docker repository<br>
      docker-compose push<br>

<br>
<br>
# TODO:

## Upload containers as stack to Azure
    az containerapp compose create -g ResourceGroup --environment ContainerappEnv  --compose-file-path docker-compose.yml
    
## Manualy Deploy. Important - use the **FallbackController**. <br>
  ### Create the build. Both must be into the same folder.
    dotnet publish -c Release -o ./bin/Publish<br>
    npm run build
    Compress-Archive -Path * -DestinationPath MdbNavigatorDeploy.zip -Force
    az webapp deploy --resource-group rg-manual-mdb-navigator --name manual-mdb-navigator --src-path .\MdbNavigatorDeploy.zip

## TODO
