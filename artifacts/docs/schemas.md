EcoLearnia Schemas
=================

EcoLearnia's domain model is consisted of following schemas:

- `CourseTemplate` - Provides information for cataloguing courses. When an instructor creates a new course, the course structure is forked from the template. In the implementaiton, the CourseTemplate is a tree of ContentNode where the root ContentNode's type is CourseTemplate. 
- `Course` - A course is a realization of a CourseTemplate which includes an instructure, start and end date, and a list of enabled ContentNodes. Note that the instructure can enable, disable and change the order of the ContentNodes.  
- `ContentNode` - ContentNode is the structure that represents the inner node of the CourseTemplate tree. The root node is always of type "CourseTemplate".
- `Content` - A content is a self-contained information that can be rendered by a UI component. It's the leaf node of a CourseTemplate tree structure.
- `ActivityNode` - When a learner performs an activity on an Assignment (i.e. COntentNode of kind Assignment), the system creates a record of this schema per ContentNode. A specific activity is registered in the Activity schema. The record of this schema includes the learner context, the Assignment, and Course. It also keeps the state of the last content accessed, which can be used for genaration of Contents.
- `Activity` -  For each ActivityNode, there is a multiplicity of Activities. An activity includes a referent to the ActivityNode and Content.


## Content ##
A content is a self-contained information that can be rendered by a UI component. 
When the contains variables in the template not assigned in the data / input properties, then it is called PartialContent (or AbstractContent)

* Content JSON Spec *

    {
        "guid": "<guid>",
        "metadata": {
            "~doc": "The area in which the learner is engaged",
            "learningArea": {
                "subject": "math",
                "subjectArea": "",
                "~doc": "Array of the topic hierarchy starting from the broadest to  specific",
                "~doc": "Without including the subject and subjectArea",
                "topic": [""]
            },

            "~doc": "If this content was originally copied from another content",
            "copiedFrom": "GUID",
            "createdAt": "2015-01-11T14:12:22",
            "modifiedAt": "2015-01-11T14:12:22",
            "authors": ["Doe, John"],
            "license": "Creative Commons",
            "locale": "en_US",
            "title": "",
            "~doc": "? How the pre recomendation should be encoded? by GUID?",
            "preRecommendations": [],
            "isAssessment": true
        },

        "body": {
            "~doc": "The models section includes data passed to",
            "models": {
                "question": {
                    "prompt": "Answer the following $expression",
                    "expression": "$num1 + $num2",
                    "num1": 5,
                    "num2": 4
                }
            },

            "~doc": "The presenters sections includes configuration information",
            "~doc": "for the UI components ",
            "persenters":{
                "my_question": {
                    "type": "TemplatedQuestion",
                    "config":{
                        "template": "$question.prompt = ${sum}",
                        "~doc": "Optionally:",
                        "template": "$question.prompt = ${sum:TextInput format:##} <br/> ${actionbar} <br/> ${feedback}"
                    }
                },
                "~doc": "The prefix 'in:' is a convention for input",
                "sum": {
                    "type": "TextInput",
                    "config": {
                        "format": "##"
                    }
                },
                "actionbar": {
                    "type": "ActionBar",
                    "config": {
                        "enabled": "submission|reset|read|hint"
                    }
                },
                "feedback": {
                    "type": "Feedback",
                    "config": {
                        "display": "list"
                    }
                }
            },

            "~doc": "The models section includes data passed to",
            "policy": {
                "maxAttempts": 10,
                "~doc": "Otional - if present, each attempt will be timed in seconds",
                "timed": 10,
                "timeOverAction": "<action to take when time is over>"
            },

            "~doc": "The models section includes data passed to",
            "submissionEval": {
                "engine": "ArithmeticExpression",
                "correctAnswer": {
                    "sum": "9"
                }
            },

            "~doc": "The models section includes data passed to",
            "feedback": [
                { 
                    "case": "$sum > $9", 
                    "message": "Number too large"
                },
                { 
                    "case": "$sum < $9", 
                    "message": "Your anser $sum is too small"
                }
            ]
             
        }
    }


## ContentNode ##
A Content Node is a node in a tree-like strcture that forms a CourseTemplate. 
The leaf of a Content Node is always a Content.

    {
        "guid": "<guid>",
        "kind": "<CourseTemplate|Assignment>",
        "metadata": {
            "~doc": "The area in which the learner is engaged",
            "learningArea": {
                "subject": "math",
                "subjectArea": "",
                "~doc": "Array of the topic hierarchy starting from the broadest to  specific",
                "~doc": "Without including the subject and subjectArea",
                "topic": [""]
            },

            "~doc": "If this content was originally copied from another content",
            "copiedFrom": "GUID",
            "createdAt": "2015-01-11T14:12:22",
            "modifiedAt": "2015-01-11T14:12:22",
            "authors": ["Doe, John"],
            "license": "Creative Commons",
            "locale": "en_US",
            "title": "",
            "~doc": "? How the pre recomendation should be encoded? by GUID?",
            "preRecommendations": [],
            "isAssessment": true
        },

        "body": {
            "items": [
                {
                    "~doc": "The type is actually dictated by this object's kind property. If it is an Assignment, then the type must be Content, otherwise it is a ContentNode",
                    "type": "ContentNode|Content|ContentGen",
                    "guid": "<content-guid>",

                    "~doc": "For item of type ContentGen, instead of guid:",
                    "gen": {
                        "templateContentGuid": "<guid>",
                        "generator": {
                            "type": "NumGen",
                            "params": {
                                "min": 0,
                                "max": 5,
                                "count" 10,
                                "vars": ["num1", "num2"],
                                "method": "permutation",
                                "shuffle": true
                            }
                        }
                    }
                }
            ]
        }
    }