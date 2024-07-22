# Verificar Estado del servidor

[[_TOC_]]

## 1.) Objetivo

El propósito de esta wiki es proporcionar una guía detallada y accesible para usuarios técnicos y no técnicos sobre cómo implementar y utilizar un script de monitoreo automatizado de la salud de servidores. Este script está diseñado para realizar comprobaciones regulares en un endpoint específico, evaluar la salud del servidor, y en caso de detectar problemas, notificar a los responsables mediante el envío de correos electrónicos de alerta.

## 2.) Funcionamiento del script

<details>
<summary> <code>verificar-servidor.py</code> </summary>

```py
import requests
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

url = '$(url_servidor)/health'
email_destinatario = '$(email_destinatario)'
sendgrid_api_key = '$(sendgrid_api_key)'
email_remitente = '$(email_remitente)'

def verificar_servidor(url):
    try:
        respuesta = requests.get(url)
        if respuesta.status_code == 200:
            print(f"El servidor en {url} está funcionando correctamente.")
        else:
            print(f"El servidor en {url} no respondió correctamente. Enviando notificación por correo electrónico.")
            enviar_email(email_destinatario, url)
    except requests.exceptions.RequestException as e:
        print(f"No se pudo conectar al servidor {url}. Enviando notificación por correo electrónico.")
        enviar_email(email_destinatario, url)

def enviar_email(destinatario, url):
    mensaje = Mail(
        from_email=email_remitente,
        to_emails=destinatario,
        subject='Alerta de Salud del Servidor',
        html_content=f'<strong>El servidor en {url} no está respondiendo correctamente. Por favor, verifica el estado del servidor.</strong>')
    try:
        sg = SendGridAPIClient(sendgrid_api_key)
        respuesta = sg.send(mensaje)
        print(f"Correo electrónico enviado. Estado: {respuesta.status_code}")
    except Exception as e:
        print(f"Error al enviar el correo electrónico: {e}")

verificar_servidor(url)
```

</details>

Este script de Python está diseñado para monitorear la salud de un servidor mediante una petición a un endpoint específico y enviar una notificación por correo electrónico en caso de detectar problemas. A continuación se describe cada componente del script para incluir en la wiki:

### 2.1) Importaciones

El script comienza importando los módulos necesarios:

- requests: Se utiliza para realizar peticiones HTTP a la URL del servidor.
- SendGridAPIClient y Mail de sendgrid: Estos se usan para enviar correos electrónicos a través de la API de SendGrid.

### 2.2) Configuración

Las variables de configuración almacenan información crucial para la operación del script:

- url: URL completa del endpoint de salud del servidor que se verificará.
- email_destinatario: Dirección de correo electrónico del destinatario que recibirá las alertas.
- sendgrid_api_key: Clave de API de SendGrid necesaria para autenticar las peticiones a la API de envío de correos.
- email_remitente: Dirección de correo electrónico del remitente registrada en SendGrid.

### 2.3) Funciones

**Función verificar_servidor:** Esta función realiza la lógica principal del monitoreo

- Petición HTTP: Se realiza una petición GET a la url proporcionada. Si la petición es exitosa, se verifica el código de estado.
- Código de Estado 200: Indica que el servidor está funcionando correctamente y se imprime un mensaje de confirmación.
- Cualquier otro código: Significa que hay un problema con el servidor. En este caso, se procede a enviar un correo electrónico de alerta.
- Excepciones: Si la petición falla por cualquier motivo (como un error de red), se captura la excepción y también se envía una notificación por correo.

**Función enviar_email**: Esta función maneja el envío de correos electrónicos:

- Configuración del Mensaje: Se crea un objeto Mail con los detalles del correo, incluyendo el remitente, el destinatario, el asunto y el contenido del mensaje en HTML.
- Envío del Correo: Se utiliza SendGridAPIClient para enviar el mensaje. Si el envío es exitoso, se imprime el estado del envío. Si falla, se captura la excepción y se imprime un error.

### 2.4) Ejecución del Script

Finalmente, el script llama a verificar_servidor(url) para iniciar el proceso de monitoreo y notificación.

### 2.5) Consideraciones

Para que este script funcione se deben tener en cuenta las siguientes consideraciones:

- A nivel de código se debe realizar la configuración del nuevo método para realizar las verificaciones tal y como se indico en la wiki para [contruir y desplegar la aplicación](https://dev.azure.com/josedanielbaena/prueba-smart/_wiki/wikis/prueba-smart.wiki/16/Deploy-Node-Application#:~:text=dentro%20del%20contenedor.-,2.10)%20Configurar%20healthcheck,-HEALTHCHECK%20%2D%2Dinterval%3D30s)
- Se debe montar un servidor sendgrid. Recomiendo usar la capa gratuita de twilio sendgrid de Azure. La documentación para montar tu propio servidor se encuentra en [configurar sendgrid](https://www.twilio.com/docs/sendgrid/for-developers/partners/microsoft-azure-2021)
- Se recomienda parametrizar las variables del script para que sea reutilizable en cualquier servidor. En este caso se parametrizan usando la sintaxis de Azure pipelines y que una librería sea la encargada de almacenar los valores.

## 3.) Estrategia de implementación

La implementacion de este script se puede tener un azure pipeline que se ejecute cada intervalo de tiempo deseado. El pipeline en formato yaml propuesto es el siguiente:

<details>
<summary> <code>verificar-servidor.yaml</code> </summary>

```yaml
trigger: none

schedules:
  - cron: "0 * * * *"
    displayName: Hourly Python Script Execution
    branches:
      include:
        - main
    always: true

jobs:
  - job: ExecutePythonScript
    pool:
      vmImage: "ubuntu-latest"
    steps:
      - task: UsePythonVersion@0
        inputs:
          versionSpec: "3.8"
          addToPath: true

      - script: |
          python devops/scripts/verificar-servidor.py
        displayName: "Run Python script"
```

</details>

**trigger:** none indica que el pipeline no se disparará automáticamente por eventos de push o merge en el repositorio. Esto asegura que las ejecuciones del pipeline sean exclusivamente controladas por la programación cron configurada.

**Schedules:** cron: "0 \* \* \* _": Esta expresión cron configura el pipeline para que se ejecute al principio de cada hora, todos los días. La estructura de un cron es [Minuto] [Hora] [Día del mes] [Mes] [Día de la semana], donde 0 _ \* \* \* se traduce como cada hora en punto.

**always:** true: Asegura que el pipeline se ejecutará de acuerdo al schedule establecido, incluso si no ha habido cambios en la rama especificada desde la última ejecución. Esto es útil para operaciones de monitoreo o tareas periódicas que necesitan ejecutarse continuamente.

Notas: Este script esta configurado para ejecutarse cada hora. Si se quiere definir otro intervalo de tiempo se dejan los siguientes ejemplos a modificar en el parametro cron:

- "0 \* \* \* \*" indica que el pipeline se ejecuta al principio de cada hora de cada día.
- "0 0,12 \* \* \*" indica que el pipeline se ejecuta a las 00:00 y a las 12:00 cada día.
- "0 0 \* \* \*" indica que el pipeline se ejecuta a las 00:00 cada día.

**Steps:**

- task: UsePythonVersion@0: Esta tarea configura la versión de Python que se usará para ejecutar el script. versionSpec: '3.8' especifica que se debe usar Python 3.8, y addToPath: true asegura que esta versión de Python esté disponible en el PATH, lo que permite usar python directamente en los comandos del
- script.
  script: | python devops/scripts/verificar-servidor.py: Este paso ejecuta el script de Python. El script se encuentra en devops/scripts/verificar-servidor.py dentro del repositorio. displayName: 'Run Python script' proporciona un nombre descriptivo para este paso en el log de Azure Pipelines.
