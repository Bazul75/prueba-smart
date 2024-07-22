# Deploy Node Application

[[_TOC_]]

## 1.) Objetivo

El objetivo de esta wiki es proporcionar una guía práctica y completa para la dockerización y la implementación de un flujo de CI/CD para una aplicación backend en Node.js, cubriendo desde la creación y optimización de un Dockerfile, hasta la configuración de pipelines de integración y despliegue continuos, y estrategias de despliegue y monitoreo en producción, con el fin de asegurar una entrega continua, eficiente y confiable de software de alta calidad.

## 2.) Dockerización

Esta sección describe el proceso de dockerización de una aplicación backend en Node.js utilizando Docker. El siguiente Dockerfile muestra cómo empaquetar la aplicación y optimizar su despliegue, asegurando que se ejecutará de manera consistente en cualquier entorno.

<details>
<summary> <code>Dockerfile</code> </summary>

```
2.1 Utiliza una imagen base ligera de Node.js
FROM node:18-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto del código de la aplicación al contenedor
COPY . .

# Crea un grupo y un usuario no root para ejecutar la aplicación
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Cambia la propiedad de los archivos de la aplicación al usuario creado
RUN chown -R appuser:appgroup /app

# Expone el puerto que la aplicación utilizará
EXPOSE 8000

# Define las variables de entorno necesarias para la aplicación
ENV DATABASE_NAME="/app/dev.sqlite"
ENV DATABASE_USER="user"
ENV DATABASE_PASSWORD="password"

# Establece el usuario no root para ejecutar la aplicación
USER appuser

# Configura un healthcheck para monitorizar la salud de la aplicación
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:8000/health || exit 1

# Comando por defecto para iniciar la aplicación
CMD ["npm", "start"]
```

</details>

### 2.1) Imagen base

`FROM node:18-alpine`
Utiliza una imagen base ligera de Node.js para reducir el tamaño del contenedor y mejorar el tiempo de construcción y despliegue.

### 2.2) Directorio de trabajo:

`WORKDIR /app`
Establece el directorio de trabajo dentro del contenedor en /app, donde se ejecutarán los comandos siguientes.

### 2.3) Copiar y instalar dependencias

```
COPY package*.json ./
RUN npm install
```

Copia los archivos de definición de dependencias package.json y package-lock.json (si existe) al contenedor y ejecuta npm install para instalar las dependencias del proyecto.

### 2.4) Copiar código de la aplicación

`COPY . .`
Copia todo el código de la aplicación al contenedor.

### 2.5) Crear usuario y grupo no root

`RUN addgroup -S appgroup && adduser -S appuser -G appgroup`
Crea un grupo appgroup y un usuario appuser dentro del grupo para mejorar la seguridad al no ejecutar la aplicación como root.

### 2.6) Cambiar permisos de los archivos

`RUN chown -R appuser:appgroup /app`
Cambia la propiedad de los archivos de la aplicación al usuario y grupo creados.

### 2.7) Exponer puerto

`EXPOSE 8000`
Expone el puerto 8000 que la aplicación utilizará para recibir conexiones.

### 2.8) Definir variables de entorno

```
ENV DATABASE_NAME="/app/dev.sqlite"
ENV DATABASE_USER="user"
ENV DATABASE_PASSWORD="password"
```

Define las variables de entorno necesarias para la configuración de la base de datos de la aplicación. En este caso esta declaración de variables servirá para entornos locales.

### 2.9) Establecer usuario de ejecución

`USER appuser`
Establece el usuario appuser para ejecutar los procesos dentro del contenedor.

### 2.10) Configurar healthcheck

`HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 CMD curl -f http://localhost:8000/health || exit 1`

Configura un healthcheck que verifica la salud de la aplicación cada 30 segundos, con un tiempo de espera de 10 segundos, un periodo de inicio de 5 segundos y hasta 3 reintentos antes de considerar que el contenedor está fallando.

Para esta configuración, es necesario agregar el siguiente fragmento de código en el index.js con el fin de agregar el endpoint para el healthcheck

```
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
```

### 2.11) Comando para iniciar la aplicación

`CMD ["npm", "start"]`
Define el comando por defecto para iniciar la aplicación utilizando npm start.

### 2.12) Mejoras y Personalización

Para mejorar y personalizar este Dockerfile según tus necesidades, considera las siguientes acciones:

- Agregar más variables de entorno: Si tu aplicación requiere configuraciones adicionales, puedes agregar más instrucciones ENV para definir esas variables.
- Configurar puertos adicionales: Si tu aplicación utiliza más de un puerto, puedes exponerlos utilizando múltiples instrucciones EXPOSE.
- Ajustar el healthcheck: Modificar lo parámetros del healthcheck según el comportamiento esperado y el tiempo de respuesta de tu aplicación.
- Optimizar las capas de Docker: Reordenar y combinar comandos para reducir el número de capas en la imagen y mejorar el rendimiento.

## 3.) CI - CD

Esta sección describe cómo configurar un flujo de CI/CD (Integración Continua y Despliegue Continuo) para una aplicación backend en Node.js utilizando Azure Pipelines. Utilizaremos pipelines como código y aprovecharemos los templates para estructurar y reutilizar configuraciones.

### 3.1) Creación de templates

Para generar el pipeline de CI/CD se generaron los siguientes templates que contienen la logica a nivel de steps y stages. Estos templates se encuentran en la ruta _'devops/plantillas'_ del repositorio. En esta carpeta vamos a encontrar 2 carpetas adicionales _'steps'_ y _'stages'_

#### 3.1.1) Steps

Este template contiene todas las tareas que se van a ejecutar tanto para la parte de CI como para la parte de CD pero cada uno tiene un archivo separado.

<details>
<summary> <code>node-back.yaml</code> </summary>

```yaml
steps:
  # Instalación de Node.js
  - task: NodeTool@0
    inputs:
      versionSpec: ${{ parameters.nodeVersion }}
    displayName: "Install Node.js"

  # Creación de proyecto en SonarCloud
  - task: sonarcloud-create-project@1
    displayName: "Create SonarCloud Project"
    inputs:
      SonarCloud: ${{ parameters.sonarSc }}
      sonarOrganization: "josedanielbaena"
      serviceKey: ${{ parameters.sonarProjectname }}
      serviceName: ${{ parameters.sonarProjectname }}
      createProject: "true"
      visibility: "public"
      long_live_branches: "(master|qa)"
      sonarQualityGate: "9"

  # Preparación para análisis de SonarCloud
  - task: SonarCloudPrepare@2
    inputs:
      SonarCloud: ${{ parameters.sonarSc }}
      organization: "josedanielbaena"
      scannerMode: "CLI"
      configMode: "manual"
      cliProjectKey: ${{ parameters.sonarProjectname }}
      cliProjectName: ${{ parameters.sonarProjectname }}
      cliSources: "."
      extraProperties: |
        # Additional properties that will be passed to the scanner, 
        # Put one key=value per line, example:
        # sonar.exclusions=**/*.bin
        sonar.javascript.lcov.reportPaths= $(System.DefaultWorkingDirectory)/coverage/*lcov.*

  # Instalación de dependencias de Node.js
  - script: |
      npm install
    displayName: "Install dependencies"

  # Ejecución de pruebas
  - script: |
      npm test
    displayName: "Run tests"

  # Publicación de resultados de pruebas
  - task: PublishTestResults@2
    inputs:
      testResultsFormat: "JUnit"
      testResultsFiles: "**/*.xml"
      failTaskOnFailedTests: true
      failTaskOnFailureToPublishResults: true
      testRunTitle: "publish"
    displayName: "Publish test results"

  # Publicación de resultados de cobertura de código
  - task: publishCodeCoverageResults@2
    inputs:
      summaryFileLocation: "**/coverage/*.xml"
      failIfCoverageEmpty: true
    displayName: "Publish code coverage"

  # Análisis de SonarCloud
  - task: SonarCloudAnalyze@2
    inputs:
      jdkVersion: "JAVA_HOME_21_X64"
    displayName: "Run SonarCloud Analysis"

  # Publicación de análisis de SonarCloud
  - task: SonarCloudPublish@2
    inputs:
      pollingTimeoutSec: "300"
    displayName: "Publish SonarCloud Analysis"

  # Interrupción del build si falla SonarCloud
  - task: sonarcloud-buildbreaker@2
    inputs:
      SonarCloud: ${{ parameters.sonarSc }}
      organization: "josedanielbaena"
    displayName: "SonarCloud Build Breaker"

  # Construcción y publicación de imagen Docker
  - task: Docker@2
    inputs:
      containerRegistry: "${{ parameters.dockerSc }}"
      repository: "bazul98/${{parameters.containerRepository}}"
      command: "buildAndPush"
      Dockerfile: "$(System.DefaultWorkingDirectory)/**/Dockerfile"
      tags: "latest"
    displayName: "Build and Push Image"
```

</details>

- task: NodeTool@0 : Instala la versión especificada de Node.js.
- task: sonarcloud-create-project@1: Crea un nuevo proyecto en SonarCloud con los parámetros especificados.
- task: SonarCloudPrepare@2: Configura el análisis de código con SonarCloud, especificando el modo de escaneo y las propiedades adicionales para el análisis. En esta seccion es importante agregar el parametro _'sonar.javascript.lcov.reportPaths= $(System.DefaultWorkingDirectory)/coverage/*lcov.*'_ para que sonarcloud pueda tomar el reporte de cobertura del proyecto y reportarlo en sonar.
- task: PublishTestResults@2: Publica los resultados de las pruebas en formato JUnit, fallando si las pruebas fallan o si no se pueden publicar los resultados.
- task: publishCodeCoverageResults@2: Publica los resultados de la cobertura de código, fallando si no se encuentra la cobertura.
- task: SonarCloudAnalyze@2: Ejecuta el análisis de código de SonarCloud.
- task: sonarcloud-buildbreaker@2: Interrumpe el pipeline si el análisis de SonarCloud no pasa el quality gate.
- task: Docker@2: Construye y publica una imagen Docker en el registro especificado.

<details>
<summary> <code>deploy-k8s.yaml</code> </summary>

```yaml
steps:
  - task: AzureRmWebAppDeployment@4
    inputs:
      ConnectionType: "AzureRM"
      azureSubscription: "${{ parameters.azureSc }}"
      appType: "webAppContainer"
      WebAppName: "${{ parameters.appServiceName }}"
      DockerNamespace: "https://index.docker.io"
      DockerRepository: "bazul98/${{ parameters.containerRepository}}"
    displayName: "Deploy to Azure App Service"
```

</details>

- task: Kubernetes@1: Esta tarea utiliza la extensión de Azure para desplegar los cambios realizados en la imagen de docker

#### 3.1.1) Stages

Este template se encarga de recopilar los steps para la parte de CI y CD.

<details>
<summary> <code>cicd-stages.yaml</code> </summary>

```yaml
parameters:
  - name: nodeVersion
    type: string
    default: "18"
  - name: sonarSc
    type: string
    default: "sonar-sc"
  - name: dockerSc
    type: string
    default: "dockerhub-sc"
  - name: containerRepository
    type: string
    default: "prueba-smart"
  - name: k8sSc
    type: string
    default: "k8s-sc"
  - name: pathToManifest
    type: string
    default: "kubernetes/deploy.yaml"
  - name: sonarProjectname
    type: string
    default: "smart-app"
  - name: azureSc
    type: string
    default: "azure-sc"
  - name: appServiceName
    type: string
    default: "smart-app"

stages:
  - stage: BuildNodeApp
    displayName: "Build Node App"
    pool:
      vmImage: ubuntu-latest
    jobs:
      - job: BuildNode
        displayName: "Build Node App"
        steps:
          - template: ../steps/node-back.yaml
            parameters:
              nodeVersion: ${{ parameters.nodeVersion }}
              sonarSc: ${{ parameters.sonarSc }}
              dockerSc: ${{ parameters.dockerSc }}
              containerRepository: ${{ parameters.containerRepository }}
              sonarProjectname: ${{ parameters.sonarProjectname }}
  - stage: DeployApp
    displayName: "Deploy App"
    pool:
      vmImage: ubuntu-latest
    dependsOn: BuildNodeApp
    jobs:
      - job: DeployAppService
        displayName: "Deploy App to App Service"
        steps:
          - template: ../steps/deploy-appservice.yaml
            parameters:
              azureSc: ${{ parameters.azureSc }}
              containerRepository: ${{ parameters.containerRepository }}
              appServiceName: ${{ parameters.appServiceName }}
```

</details>

Este template está diseñado para construir y desplegar una aplicación Node.js en un clúster de Kubernetes utilizando Azure Pipelines. A continuación, se explican los parámetros, las etapas y los trabajos involucrados.

Parámetros del Pipeline: Los parámetros permiten configurar el pipeline de manera flexible y reutilizable. Estos son los parámetros definidos:

- nodeVersion: La versión de Node.js que se instalará (por defecto '18').
- sonarSc: La conexión de servicio a SonarCloud.
- dockerSc: La conexión de servicio al registro Docker.
- containerRepository: El repositorio de contenedores donde se publicará la imagen.
- sonarProjectname: El nombre del proyecto en SonarCloud.
- azureSc: Service connection al grupo de recursos en donde se encuentra el appservice.
- appServiceName: Nombre del appservice donde se alojara la aplicacion.

**stage: BuildNodeApp**
Esta etapa construye la aplicación Node.js.

- pool: Define la imagen de VM a usar (ubuntu-latest).
- jobs: Contiene un trabajo llamado BuildNode.
- steps: Importa los pasos definidos en el template node-back.yaml y pasa los parámetros necesarios.

**stage: DeployApp**

Esta etapa despliega la aplicación en el appservice creado.

- dependsOn: Indica que esta etapa depende de la finalización exitosa de BuildNodeApp.
- jobs: Contiene un trabajo llamado DeployKubernetes.
- steps: Importa los pasos definidos en el template deploy-k8s.yaml y pasa los parámetros necesarios.

### 3.2) Configuraciones adicionales en el proyecto

#### 3.2.1) Ejecución de pruebas unitarias

Para realizar la correcta ejecución de las pruebas unitarias y el reporte de coberturas se realizaron los siguientes cambios.

- A nivel de index.js y index.test.js se realiza una refactorización para asegurar que la base de datos esté completamente sincronizada antes de que el servidor comience a escuchar por conexiones, evitando así problemas de sincronización y asegurando que la aplicación esté lista para manejar solicitudes.
- A nivel de librerías se debe realizar la siguiente instalación en el proyecto con el comando `npm install --save-dev jest-junit jest-html-reporterc` y en el archivo package.json debemos garantizar que se genere lo siguiente para garantizar el correcto reporte de cobertura:

```json
},
  "jest": {
    "transform": {
      "^.+\\.js?$": "babel-jest"
    },
    "reporters": [
      "default",
      [
        "jest-junit",
        {
          "outputDirectory": "./reports",
          "outputName": "junit.xml"
        }
      ],
      [
        "jest-html-reporter",
        {
          "outputPath": "./reports/test-report.html"
        }
      ]
    ],
    "coverageDirectory": "./coverage",
    "coverageReporters": [
      "text",
      "cobertura",
      "html",
      "lcov"
    ]
  }
```

### 3.1) Creación del pipeline de CI/CD

Este pipeline se encargara de recopilar todos los templates y pasarle los parametros para lograr la ejecucion de todas las etapas. Para generarlo debemos generar el siguiente archivo yaml en el proyecto:

<details>
<summary> <code>ci-cd.yaml</code> </summary>

```yaml
trigger:
  - main
  - test

variables:
  - group: smart-app

stages:
  - template: "./devops/plantillas/ci-cd/stages/cicd-stages.yaml"
    parameters:
      nodeVersion: 18
      sonarSc: $(sonarSc)
      sonarProjectname: "prueba-smart"
      dockerSc: $(dockerSc)
      containerRepository: $(containerRepository)
      azureSc: $(azureSc)
      appServiceName: $(appServiceName)
```

</details>

**Para este pipeline debemos tener en cuenta lo siguiente:**

- Las variables las debemos almacenar en un variablegroup, que para este caso se llama prueba-smart. Aquí se almacenan las credenciales de las bases de datos y los service connection que se utilizan en todo el proyecto.

- trigger: Define las ramas que activarán la ejecución del pipeline. En este caso, cualquier cambio en las ramas master o test activará el pipeline.
- variables: Define un grupo de variables llamado smart-app. Los grupos de variables son colecciones de variables que pueden ser reutilizadas en múltiples pipelines.
- stages: Define las etapas del pipeline utilizando un template externo ubicado en ./devops/plantillas/ci-cd/stages/cicd-stages.yaml.

**Parámetros del Template**

- nodeVersion: La versión de Node.js que se instalará (18).
- sonarSc: La conexión de servicio a SonarCloud, referenciada como $(sonarSc) desde las variables definidas en el grupo de variables smart-app.
- sonarProjectname: El nombre del proyecto en SonarCloud (prueba-smart).
- dockerSc: La conexión de servicio al registro Docker, referenciada como $(dockerSc) desde las variables definidas en el grupo de variables smart-app.
- containerRepository: El repositorio de contenedores donde se publicará la imagen, referenciado como $(containerRepository) desde las variables definidas en el grupo de variables smart-app.
- azureSc: Service connection al grupo de recursos en donde se encuentra el appservice.
- appServiceName: Nombre del appservice donde se alojara la aplicacion.

Una vez definimos los archivos debemos realizar la configuracion en Azure Devops de la siguiente manera:

En la seccion de azure pipelines vamos a dar en 'New pipeline'

![image.png](/.attachments/image-7fd7dfc0-4f7b-411c-83f0-b538b6653c22.png)

Esto nos desplegara la opcion para ubicar el código de nuestro proyecto que para este caso esta en github

![image.png](/.attachments/image-3c7fe3aa-664a-4a7c-9691-4e7c83ff15ac.png)

Alli, debemos seleccionar el repositorio, seleccionar la opcion _'Existing Azure Pipelines YAML file'_ y ubicamos nuestro archivo yaml (ci-cd.yaml)

![image.png](/.attachments/image-c40be1be-619b-4d84-a3fd-947ec81b00bc.png)

Una vez seleccionado esto, debemos continuar, guardar y ejecutar.

## 4.) Consumo de la aplicacion

- El servicio se expone utilizando el dominio por default que nos da azure para los appservices. El endpoint para consumir el servicio es el siguiente:
- https://prueba-smart.azurewebsites.net
  Allí se pueden realizar las peticiones para crear usuarios y consultar usuarios con los paths correspondientes y realizar la verificación del estado del servicio.
