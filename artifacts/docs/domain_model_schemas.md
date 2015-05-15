EcoLearnia Schemas
=================

EcoLearnia's domain model is consisted of following schemas:

Content Template: Data in this category are created once and used to create courses.
The Content Template are subject to seldom changes over time.
It can represent a State's curriculum.

- `ContentNode` - ContentNode is the structure that represents the inner node of the tree structure that represents a Course. The root node is always of kind "CourseTemplate" and the nodes that contains the ContentItem are of kind "Assignment"
- `ContentItem` - A ContentItem contains details of specific learning content. The information in the ContentItem is used to render multiplicity of UI components that represents learning content. From the content structure point of view, it is the leaf node.

Course Structure: Data in this category are created per course. The records have the lifespan of a course. Once the course is completed, the records do not change.

- `Course` - A course is a realization of a ContentNode of kind "CourseTemplate". A Course has context of instructor(s), start and end dates, and a list of Assignments.  It usually copies the structure of CourseTemplate ContenNode which the course was created from, but the instructor can enable, disable and change the order of the Assignments.  
- `Assignment` - Assignment is a realization of ContentNode of kind "Assignment". 
- `AssignmentItem` - AssignmentItem is a realization of ContentNode of kind "ContentItem". Although it is meant to be used as provided, the instructor is free to change the specific details of the item. 

Learner's Activity: Data in this category are created for each of the learner's action within a course.

- `LearnerCourse` - Contextual data of a course to a specific learner. E.g. obtained time spent, score, etc. 
- `LearnerAssignment` - When a learner access (opens) an Assignment (i.e. ContentNode of kind 'Assignment'), the system creates a record of this schema per ContentNode. A specific activity is registered in the Activity schema. The record of this schema includes the learner context, the Assignment, and Course. It also keeps the state of the last content accessed, which can be used for genaration of Contents.
- `LearnerAssignmentItem` -  For each AssignmentActivity, there is a multiplicity of Activities. An activity includes a referent to the ActivityNode and Content.
- `LearnerAssignmentItemActivity` -  For each AssignmentActivity, there is a multiplicity of Activities. An activity includes a referent to the ActivityNode and Content.


## ContentItem ##
A content is a self-contained information that can be rendered by a UI component. 
When the contains variables in the template not assigned in the data / input properties, then it is called PartialContent (or AbstractContent).

The ContentItem's body is comprised of the follosing sections:
- models: includes all domain data that is required to render a content. 
- presenters: includes declaration of presentation methods of the models. 
- processFlow: includes any other processing, e.g. randomizing certain data in the model.
- policy: includes assessment policy parameters, e.g. allowed number of attempts. 
- submissionEval: includes specification for submission evaluation. Defines which engine should evaluate the submission. 

Note that it is possible for presenters to include configuration, but it is suggested to use model to define all data that can be used by other sections. For example the submissionEval can use model's data to calculate the correct value in case or simple arithmetics.

* Whenever there is change in the JSON spec, make sure to update both the server schema and client model.

The Content JSON Spec

    {
        "sid": "System id",
        "realmUuid": "uuid of the space where the uuid is unique",
        "uuid": "<uuid>",
        "parent": "<uuid>",
        "createdBy": "<uuid>",
        "createdAt": "2015-01-11T14:12:22",
        "modifiedBy": "<uuid>",
        "modifiedAt": "2015-01-11T14:12:22",
        "@doc": "If this content was originally copied from another content",
        "copiedFrom": "<uuid>",
        "metadata": {
            "@doc": "The area in which the learner is engaged",
            "learningArea": {
                "subject": "math",
                "subjectArea": "arithmetic",
                "@doc": "Core Standards domain code (e.g. 3.NBT)", 
                "domainCodeSource": "CommonCore",
                "@doc": "Core Standards domain code (e.g. 3.NBT)", 
                "domainCode": "arithmetic",
                "@doc": "Array of the topic hierarchy starting from the broadest to  specific",
                "@doc": "Without including the subject and subjectArea",
                "topicHierarchy": [""],
                "tags": [""]
            },

            "@doc": "If this content was originally copied from another content",
            "copiedFrom": "uuid",
            "createdAt": "2015-01-11T14:12:22",
            "modifiedAt": "2015-01-11T14:12:22",
            "version": "<semantic_versioning>",
            "authors": ["Doe, John"],
            "license": "Creative Commons",
            "locale": "en_US",
            "title": "",
            "@doc": "List of uuid which is recommended to take prior this ContentItem",
            "preRecommendations": [],
            "isAssessment": true
        },

        "body": {
            "@doc": "The models section includes domain data",
            "models": {
                "@doc": "The question model is required for assessment item",
                "question": {
                    "@doc": "Within the question model, at minimum there is the prompt property",
                    "prompt": "Answer the following $expression",
                    "expression": "$num1 + $num2",
                    "num1": 5,
                    "num2": 4
                }
            },

            "@doc": "The component section includes specification for each of the ",
            "@doc": "interactive (UI) components",
            "components":[
                {
                    "id": my_question",
                    "type": "question.Templated",
                    "config":{
                        "template": "$question.prompt = ${sum} <br/> ${actionbar} <br/> ${feedback}"
                    }
                },
                {
                    "id": "sum",
                    "type": "input.Text",
                    "config": {
                        "dataType": "integer",
                        "format": "##"
                    }
                },
                {
                    "id": "actionbar",
                    "type": "ActionBar",
                    "config": {
                        "enabled": "submission|reset|read|hint"
                    }
                },
                {
                    "id": feedback",
                    "type": "Feedback",
                    "config": {
                        "display": "list"
                    }
                }
            ],

            "actions": {
                "showSolution": "4 + 4 + 1 = 9",
                "!doc": "hints is an array in the order that is shown per attempt failure",
                "showHints": [
                    "How can 5 be decomposed?"
                    ]
            },

            "@doc": "Optional additional processing. E.g. randomizing numbers prior rendering",
            "processFlow": {
                "beforeRender": {

                    },
                "afterSumission": {

                }
            },

            "@doc": "Policy parameters for the assesmsent",
            "policy": {
                "maxAttempts": 10,
                "@doc": "Optional - if present, each attempt will be timed in seconds",
                "timed": 10,
                "timeOverAction": "<action to take when time is over>"
            },

            "@doc": "Parameters for evalating learner's answer submission",
            "submissionEval": {
                "engine": "ArithmeticExpression",
                "correctAnswer": {
                    "sum": "9"
                },
                "@doc": "The models section includes data passed to",

                "feedback": [
                    { 
                        "case": "$sum > $9", 
                        "message": "Number too large"
                    },
                    { 
                        "case": "$sum < $9", 
                        "message": "Your anser $sum is too small"
                    }
                ],
                "solution": "<HTML>",
                "hints": [
                    "First hint"
                ]
            }
        }
    }


## ContentNode ##
A Content Node is a node in a tree-like structure that forms a CourseTemplate. 
The leaf of a ContentNode is always a ContentItem.
The structure is always strict tree, no node or item can have more than one parent.
If a child's item type is 'ContentGen', at the moment of creating a Course, the AssinmentItem will be translated into multiple items based on the genration rule.

    {
        "realmUuid": "uuid of the space where the uuid is unique",
        "uuid": "<uuid>",
        "refName": "M-AR-1", 
        "parent": "<oid>",
        "parentUuid": "<uuid>",
        "createdBy": "oid",
        "createdAt": "2015-01-11T14:12:22",
        "modifiedBy": "oid",
        "modifiedAt": "2015-01-11T14:12:22",
        "kind": "<CourseTemplate|Container|Assignment>",
        "@doc": "If this content was originally copied from another content",
        "copiedFrom": "<uuid>",

        "metadata": {
            "@doc": "The area in which the learner is engaged",
            "learningArea": {
                "subject": "math",
                "subjectArea": "",
                "@doc": "Array of the topic hierarchy starting from the broadest to  specific",
                "@doc": "Without including the subject and subjectArea",
                "topic": [""]
            },

            "createdAt": "2015-01-11T14:12:22",
            "modifiedAt": "2015-01-11T14:12:22",
            "authors": ["Doe, John"],
            "license": "Creative Commons",
            "locale": "en_US",
            "title": "",
            "@doc": "List of uuids of content nodes that is recommened to take prior this one",
            "preRecommendations": [],
            "isAssessment": true
        },

        "body": {
            "@doc": "There is no foreign key for child nodes.",
            "@doc": "Child nodes are obtained through the parent FK from the children",
            "items": [
                {
                    "@doc": "The type is actually dictated by this object's kind property. If it is an Assignment, then the type must be Content, otherwise it is a ContentNode",
                    "type": "Item|ItemGen",
                    "item": "<oid>",
                    "itemUuid": "<contentitem-uuid>",
                    "@doc": "Difficulty of the item in respect to the other items within this node"
                    "difficulty": "[0..1]",

                    "@doc": "For item of type ContentGen, instead of uuid:",
                    "gen": {
                        "templateContentItem": "<uuid>",
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
Realization of ContentNode of kind 'CourseTemplate'.
Instead of reusing a AssignmentNode, which is analogus to ContentNode, we have
a dedicated schema for course to include additional information.

    {
        "uuid": "<uuid>",
        "contentNode": "<uuid>",
        "createdBy": "uuid",
        "createdAt": "2015-01-11T14:12:22",
        "modifiedBy": "uuid",
        "modifiedAt": "2015-01-11T14:12:22",
        "learningArea": {
            },
        "title": "",
        "description": "",
        "website": "",

        "institution": <if applicable>,
        "instructors": [<user-uuids>],
        "openness": <for-general, private>,
        "status": <open-for-enrollment, started-accepting, started-not-accepting, closed>,
        "preRecommendations": [],

        "startTime": "2015-01-11T14:12:22",
        "endTime": "2015-01-11T14:12:22",
        "timezone": "<if applicable>",
        "numEnrollment": <num stduents>,
        
    }

Q: Do we need internal nodes?


## AssignmentNode ##
Realization of a ContentNode of kind 'Assignment'.

Schema extends from ContentNode:

    {
        "course": <uuid>,
        "@doc": "The content from which this assignment was created",
        "@doc": "The kind is analogus: Container | Assignment",
        "@doc": "Property copiedFrom is the uuid of the ContentNode that this Assignment was copied from"
    }


## AssignmentItem ##
Realization of a ContentItem.

Schema extends from ContentItem:

    {
        "course": <uuid>,
        "@doc": "Property parent is the uuid of the Assignment that this AssignmentItem belongs to",
        "@doc": "Property copiedFrom is the uuid of the ContentNode tha this Assignment was copied from"
    }


## LearnerAssignment ##
Track of access to an Assignment by a learner. Keeps the assignment status, including the current working item (or in the case of adaptive, the information required to know the next item). 

    {
        "sid": "sequential (system) id",
        "uuid": "<uuid>",
        "assignment": "<uuid>",
        "createdAt": "2015-01-11T14:12:22",
        "modifiedAt": "2015-01-11T14:12:22",
        "user": <the_learners_uuid>,
        "currentItem": <current_item_index>,
        "numItems": <total_num_of_items>,

        "startTime": "2015-01-11T14:12:22",
        "endTime": "2015-01-11T14:12:22",
        "timezone": "<if applicable>",

        "assignmentBody": <cached_assignment_body>
    }


## LearnerAssignmentItem ##
AssignmentItem instantiated by a learner. The ContentItem is cached.

    {
        "sid": "sequential (system) id",
        "uuid": "<uuid>",
        "assignmentInstance": "<uuid>",
        "createdAt": "2015-01-11T14:12:22",
        "modifiedAt": "2015-01-11T14:12:22",
        "user": <the_learners_uuid>,

        "startTime": "2015-01-11T14:12:22",
        "endTime": "2015-01-11T14:12:22",
        "timezone": "<if applicable>",
        "score": [0..1],
        "attempts": <num>,

        "assignmentItemBody": <cached_assignment_item_body>
    }


## LearnerAssignmentItemActivity ##
AssignmentItem instantiated by a learner. The ContentItem is cached.

    {
        "sid": "sequential (system) id",
        "uuid": "<uuid>",
        "assignmentItemInstance": "<uuid>",
        "createdAt": "2015-01-11T14:12:22",
        "user": <the_learners_uuid>,

        "startTime": "2015-01-11T14:12:22",
        "endTime": "2015-01-11T14:12:22",
        "timezone": "<if applicable>",
        "remoteAgent": {
            "type": <web | mobile>
            "address": <IP> 
        }
        "action": "<read | hint | submit>",
        "parameters": <parameter object, e.g. submission>

        "assignmentItemBody": <cached_assignment_item_body>
    }