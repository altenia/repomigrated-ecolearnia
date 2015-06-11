
## EcoLearnia

### About EcoLearnia - The Big Picture
EcoLearnia is an open source learning platform that enables ecosystem of 
learning content production and consumption.

The consumers are people or entities that use the contents or their derivatives 
directly or indirectly:
- Learners (aka. students): those who use the system to learn a particular 
skill.
- Educators: those who use the system to teach skills. These users would
usually organizing contents and assign them to learners, also consume the 
by products of the contents, such as the assessment results.
- Educational Institutions: second-tier providers of the content. Examples:
Schools, Libraries, Museums, Academic institutions, etc.
- Learning Scientists: those who use the system to analyse the assessment 
results data together with the associated content. These users may use the 
data to answer questions such as: how does the content affect the cognitive
process? What factors involves in learning? How can the efficacy be improved?

The producers are people or entities that creates content either private for 
closed group usage, or open (i.e. free license) for general consumption:
- Educators: educators are empowered with authoring tool so they can author
original learning content, or modify existing one.
- App/Game Developers: developers can use the platforms libraries and APIs 
to produce apps that is deployed on top of the platform. Game is a good 
example of such app.
The contents produced with open license are curated/moderated guarantee certain
level of quality.

EcoLearnia Platform is provided under the licence as specified in the 
LICENSE file in the root directory.

### EcoLearnia Components
EcoLearnia consists of:
- EcoLearnia Platform Server ([EL-PS](https://github.com/altenia/ecolearnia)): The main server running in the cloud. Provides 
services such as: account, content, course, assignment, game, data analytics, 
etc. The server should be up in order for other components to operate.
- EcoLearnia Interactives (EL-I): The JavaScript client library that provides UI objects 
(widgets) that renders the content and handles interactions.
- EcoLearnia Studio (EL-S): The web-based content production tool for users to
author contents. The preview uses the EL-I for rendering the UI objects.

*NOTE:* Currently The EL-I and EL-S are in the same repository. They will be eventually
separated into different repos.

## Installing EcoLearnia Platform Server

The system is based on nodejs and [hapi framework](http://hapijs.com/).

### Pre-requisites
- Have nodejs installed. Recommended version is 0.12.x
- Have git client installed.
- For debugging, you will also require node-inspector.

### Downloading and building

The easiest way to install the EL-S is to clone the repository from github

`git clone https://github.com/altenia/ecolearnia.git`

Once cloned, go the ecolearnia-studio directory and install the dependencies

`npm install`


## Directory Structure

- `artifacts`: Includes documentation and other non-source-code artifacts
- `config`: Contains the configuration file
- `lib`: Source code
- `node_modules`: nodejs' packages
- `public`: Web server's public folder. It contains public assets such as css.
- `resources`: Web server's public folder. It contains public assets such as css.
- `tests`: Tests.
- `el-server.js`: The main execution script 
- `LICENSE`: The license of this software


## Configuring the Server

The server configuration file is `config/ecolearnia-server.conf.json`.

    {
        "port": 8080,
    
        "cohevium": {
          "publicPath": "public",
          "contentBaseDir": "cohevium-content"
        },
    
        "log": {
            "level": "debug",
        }
    }


## Running the Server

To run in normal mode:
`node el-server.js`

To run in debug mode:
`node --debug el-server.js`

See the reference below - development link - for further detail on running in debug mode.


## Development

For development of the interactives and extending the tool, please see the 
references below.


## References

- EcoLearnia server [repository](https://github.com/altenia/ecolearnia)
- EcoLearnia content doc [repository](https://github.com/altenia/ecolearnia)
- Interactives development: [artifacs/docs/interactives-dev.md](./artifacts/docs/interctives-dev.md)
- Studio development: [artifacs/docs/studio-dev.md](./artifacts/docs/studio-dev.md)


## LICENSE

## Contributing

Education is not in hands of few organizations, but it’s everyone’s business. 
We should all be participant, actively collaborating to the disseminating 
knowledge to our kids and generations to come.

Your contribution and support is highly valuable. We invite you to be an active 
participant of the education fostering community. 

Feel free to fork and improve/enhance EcoLearnia any way you want. If you feel 
that the system or the Ace community will benefit from your changes, please open 
a pull request.