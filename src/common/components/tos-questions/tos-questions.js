'use strict';

angular.module('knowhub')
    .component('tosQuestions', {
        templateUrl: 'common/components/tos-questions/tos-questions.html',
        bindings: {
            mode: '@',
            onEvaluate: '&'
        },
        controller: function todQuestionsController(userService, userType, $exceptionHandler) {

            let $ctrl = this;
            let NUM_QUESTIONS = 5;

            let questionsForExperts = [{
                id: 'Q1',
                type: 'single',
                numAnswers: 3
            },
                {
                    id: 'Q2',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q3',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q4',
                    type: 'multi',
                    numAnswers: 4
                },
                {
                    id: 'Q5',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q6',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q7',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q8',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q9',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q10',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q11',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q12',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q13',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q14',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q15',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q16',
                    type: 'multi',
                    numAnswers: 4
                },
                {
                    id: 'Q17',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q18',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q19',
                    type: 'multi',
                    numAnswers: 4
                }
            ];

            let questionsForSeekers = [{
                id: 'Q20',
                type: 'multi',
                numAnswers: 3
            },
                {
                    id: 'Q21',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q22',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q23',
                    type: 'multi',
                    numAnswers: 4
                },
                {
                    id: 'Q24',
                    type: 'multi',
                    numAnswers: 3
                },
                {
                    id: 'Q25',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q26',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q27',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q28',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q29',
                    type: 'single',
                    numAnswers: 4
                },
                {
                    id: 'Q30',
                    type: 'multi',
                    numAnswers: 4
                },
                {
                    id: 'Q31',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q32',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q33',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q34',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q35',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q36',
                    type: 'single',
                    numAnswers: 3
                },
                {
                    id: 'Q37',
                    type: 'single',
                    numAnswers: 3
                }
            ];

            let questions;
            let answers;

            $ctrl.$onInit = function () {

                if ($ctrl.mode !== userType.seeker && $ctrl.mode !== userType.expert) {
                    let err = new Error("TOS Questions: Invalid mode.");
                    $exceptionHandler(err);
                }

                $ctrl.numQuestions = NUM_QUESTIONS;
                $ctrl.ngRepeatToForArray = angular.ngRepeatToForArray;
                if ($ctrl.mode === userType.expert) {
                    questions = questionsForExperts;
                } else {
                    questions = questionsForSeekers;
                }
                questions.shuffle();
                answers = [];
                $ctrl.currentAnswer = {
                    answered: false,
                    value: []
                };
                $ctrl.currentQuestion = questions[0];
                $ctrl.currentQuestionNum = 1;
            };

            $ctrl.markAnswered = function () {
                $ctrl.currentAnswer.answered = true;
            };

            $ctrl.nextQuestion = function () {
                answers.push({
                    question: $ctrl.currentQuestion.id,
                    userAnswer: serializeAnswer()
                });
                if ($ctrl.currentQuestionNum < $ctrl.numQuestions) {
                    $ctrl.currentQuestionNum++;
                    $ctrl.currentQuestion = questions[$ctrl.currentQuestionNum - 1];
                    $ctrl.currentAnswer = {
                        answered: false,
                        value: $ctrl.currentQuestion.type === 'multi' ? [] : ""
                    };
                }
            };


            $ctrl.submitQuestions = function () {
                if (answers.length < NUM_QUESTIONS) {
                    $ctrl.nextQuestion();
                }
                return userService.evaluateTOSQuestionnaire(answers, $ctrl.mode).then(function (evaluation) {
                    return userService.loadBasicInfo().then(function () {
                        $ctrl.onEvaluate({
                            $event: {
                                evaluation: evaluation
                            }
                        });
                    });
                });
            };

            function serializeAnswer() {
                let serializedAnswer = "";
                if ($ctrl.currentQuestion.type === 'multi') {
                    let i;
                    let allowedAnswers = $ctrl.currentQuestion.type === 'multi' ? $ctrl.currentQuestion.numAnswers : 1;
                    for (i = 0; i < allowedAnswers; i++) {
                        let answerValue = $ctrl.currentAnswer.value[i];
                        if (answerValue) {
                            if (serializedAnswer) {
                                serializedAnswer += ",";
                            }
                            serializedAnswer += (i + 1);
                        }
                    }
                } else {
                    serializedAnswer = $ctrl.currentAnswer.value;
                }
                return serializedAnswer;
            }
        }
    });