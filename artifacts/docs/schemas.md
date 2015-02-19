EcoLearnia Schemas
=================

EcoLearnia's domain model is consisted of following schemas:

Content Template: Data in this category are created once and used to create courses.

- `ContentNode` - ContentNode is the structure that represents the inner node of the tree structure that represents a Course. The root node is always of kind "CourseTemplate" and the nodes that contains the ContentItem are of kind "Assignment"
- `ContentItem` - A ContentItem contains details of specific learning content. The information in the ContentItem is used to render multiplicity of UI components that represents learning content. From the content structure point of view, it is the leaf node.

Course Structure: Data in this category are created per course.

- `Course` - A course is a realization of a ContentNode of kind "CourseTemplate". A Course has context of instructor(s), start and end dates, and a list of Assignments.  It usually copies the structure of CourseTemplate ContenNode which the course was created from, but the instructor can enable, disable and change the order of the Assignments.  
- `Assignment` - Assignment is a realization of ContentNode of kind "Assignment". 
- `AssignmentItem` - AssignmentItem is a realization of ContentNode of kind "ContentItem". Although it is meant to be used as provided, the instructor is free to change the specific details of the item. 

Learner Activity: Data in this category are created for each of the learner's action.

- `AssignmentInstance` - When a learner access (opens) an Assignment (i.e. ContentNode of kind 'Assignment'), the system creates a record of this schema per ContentNode. A specific activity is registered in the Activity schema. The record of this schema includes the learner context, the Assignment, and Course. It also keeps the state of the last content accessed, which can be used for genaration of Contents.
- `ItemInstance` -  For each AssignmentActivity, there is a multiplicity of Activities. An activity includes a referent to the ActivityNode and Content.
- `ItemInstanceActivity` -  For each AssignmentActivity, there is a multiplicity of Activities. An activity includes a referent to the ActivityNode and Content.


## ContentItem ##
A content is a self-contained information that can be rendered by a UI component. 
When the contains variables in the template not assigned in the data / input properties, then it is called PartialContent (or AbstractContent)

The Content JSON Spec

    {
        "guid": "<guid>",
        "parentGuid": "<guid>",
        "~doc": "If this content was originally copied from another content",
        "copiedFrom": "<GUID>",
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
The leaf of a ContentNode is always a ContentItem.
The structure is always strict tree, no node or item can have more than one parent.
If a child's item type is 'ContentGen', at the moment of creating a Course, the AssinmentItem will be translated into multiple items based on the genration rule.

    {
        "guid": "<guid>",
        "parentGuid": "<guid>",
        "kind": "<CourseTemplate|Assignment>",
        "~doc": "If this content was originally copied from another content",
        "copiedFrom": "<GUID>",

        "metadata": {
            "~doc": "The area in which the learner is engaged",
            "learningArea": {
                "subject": "math",
                "subjectArea": "",
                "~doc": "Array of the topic hierarchy starting from the broadest to  specific",
                "~doc": "Without including the subject and subjectArea",
                "topic": [""]
            },

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
                    "type": "Node|Item|ContentGen",
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


## Course ##
A realization of a CourseTempate.

    {
        "guid": "<guid>",
        "courseNode": "<guid>",
        "createdAt": "2015-01-11T14:12:22",
        "modifiedAt": "2015-01-11T14:12:22",
        "title": "",
        "description": "",
        "website": "",
        "learningArea": {
            },
        "~doc": "? How the pre recomendation should be encoded? by GUID?",
        "institution": <if applicable>,
        "instructors": [],
        "openness": <for-general, private>
        "status": <open-for-enrollment, started-accepting, started-not-accepting, closed>,
        "preRecommendations": [],

        "startTime": "2015-01-11T14:12:22",
        "endTime": "2015-01-11T14:12:22",
        "timezone": "<if applicable>",
        "numEnrollment": <num stduents>,
        
    }
