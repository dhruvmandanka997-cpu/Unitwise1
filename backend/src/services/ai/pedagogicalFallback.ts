import { 
  GeneratePlanInput, 
  GeneratePlanInputSchema,
  LessonPlan, 
  WeeklyPlan, 
  SessionPlan, 
  FinalAssessment, 
  ResourceItem,
  StandardAlignment,
  BloomLevel
} from '../../models/plan';

export class PedagogicalFallbackGenerator {
  public generate(rawInput: Partial<GeneratePlanInput> & {
    title: string;
    subject: string;
    gradeLevel: string;
    durationWeeks: number;
    sessionsPerWeek: number;
    classDurationMinutes: number;
  }): LessonPlan {
    const input: GeneratePlanInput = {
      curriculumFramework: 'General Standards',
      standardsFramework: '',
      format: 'session_sequence',
      priorKnowledge: '',
      overallGoals: rawInput.title,
      studentNeeds: 'Universal Design for Learning (UDL) diverse learner support',
      availableResources: 'Standard classroom instructional materials',
      preferredTeachingMethods: ['Explicit Instruction & Modeling', 'Guided Practice'],
      assessmentPreferences: 'Daily formative checks & summative evaluation',
      classSize: 25,
      teacherNotes: '',
      textbookChapters: '',
      holidaysOrBlackoutDates: '',
      languageOfInstruction: 'English',
      proficiencyRange: 'Standard distribution',
      accommodations: 'Visual aids and differentiated pacing',
      requiredProjects: '',
      enableHomework: true,
      ...rawInput,
      curriculumSource: rawInput.curriculumSource || 'preferences',
    };
    const id = 'plan_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const now = new Date().toISOString();

    const totalSessions = input.durationWeeks * input.sessionsPerWeek;
    const weeklyPlans: WeeklyPlan[] = [];

    // Derive weekly themes based on Backward Design principles
    const weeklyThemes = this.deriveWeeklyThemes(input.title, input.subject, input.durationWeeks);

    let globalSessionCounter = 1;

    for (let w = 1; w <= input.durationWeeks; w++) {
      const weekTheme = weeklyThemes[w - 1] || {
        theme: `Phase ${w}: Deepening Mastery & Applied Problem Solving`,
        title: `Week ${w}: ${input.title} - Investigation & Synthesis`,
        focus: `Consolidate core competencies and expand conceptual breadth.`,
        vocab: ['Synthesis', 'Evaluation', 'Methodology', 'Application', 'Evidence']
      };

      const sessions: SessionPlan[] = [];

      for (let s = 1; s <= input.sessionsPerWeek; s++) {
        const session = this.generateSessionPlan({
          planId: id,
          weekNumber: w,
          dayNumber: s,
          sessionNumber: globalSessionCounter,
          totalSessions,
          topicTitle: input.title,
          subject: input.subject,
          gradeLevel: input.gradeLevel,
          durationMinutes: input.classDurationMinutes,
          weekTheme: weekTheme.theme,
          standardsFramework: input.standardsFramework || input.curriculumFramework,
          enableHomework: input.enableHomework,
        });

        sessions.push(session);
        globalSessionCounter++;
      }

      const weeklyAssessment = {
        type: w === input.durationWeeks ? 'Cumulative Unit Performance Task' : 'Weekly Checkpoint & Formative Portfolio Review',
        description: `Summative checkpoint for Week ${w} measuring student comprehension of ${weekTheme.theme} through performance criteria.`,
        checkpointCriteria: [
          `Accurately explains core terminology: ${weekTheme.vocab.slice(0, 3).join(', ')}`,
          `Demonstrates independent proficiency on weekly target competencies`,
          `Applies reasoning in novel problem or analysis scenarios with minimal prompting`
        ]
      };

      weeklyPlans.push({
        id: `week_${id}_${w}`,
        weekNumber: w,
        title: weekTheme.title,
        theme: weekTheme.theme,
        learningGoals: [
          `Master fundamental mechanisms and core principles underlying ${weekTheme.theme}.`,
          `Apply structured analytical thinking to resolve guided and authentic challenges.`,
          `Synthesize key takeaways to prepare for cumulative progression in subsequent modules.`
        ],
        vocabulary: weekTheme.vocab,
        prerequisites: w === 1 
          ? (input.priorKnowledge ? [input.priorKnowledge] : ['Foundational grade-level prerequisite concepts']) 
          : [`Mastery of Week ${w - 1} foundational concepts and skill checkpoints`],
        sessions,
        weeklyAssessment,
        weeklyResources: [
          `Week ${w} Guided Student Activity Workbook & Reference Slips`,
          `Interactive Slide Deck with Embedded Check-for-Understanding Prompts`,
          `Targeted Practice Problem Sets (Tiered Levels 1-3)`
        ],
        reflectionPrompt: `Which instructional strategies best supported student mastery of ${weekTheme.theme} this week, and which concepts require retrieval warm-ups next week?`,
        teacherNotes: input.teacherNotes ? `Teacher Reminder: ${input.teacherNotes}` : 'Review formative exit tickets to differentiate pacing for upcoming sessions.'
      });
    }

    const finalAssessment: FinalAssessment = {
      title: `${input.title} - Culminating Capstone & Evaluation`,
      type: 'Culminating Project',
      description: `A comprehensive performance-based assessment where students demonstrate mastery of ${input.title} by synthesizing unit concepts, solving complex multi-step tasks, and defending their findings.`,
      rubric: [
        {
          criterion: 'Conceptual Understanding & Accuracy',
          weightPercentage: 35,
          exemplary: 'Demonstrates thorough, flawless mastery of all unit concepts; integrates nuanced terminology effortlessly without misconceptions.',
          proficient: 'Demonstrates solid understanding with accurate application of major concepts; minor incidental errors that do not impair core logic.',
          developing: 'Demonstrates partial grasp of core concepts; relies heavily on scaffolding or exhibits notable conceptual gaps.',
          beginning: 'Demonstrates minimal comprehension; struggles to apply foundational terminology or concepts accurately.'
        },
        {
          criterion: 'Problem Solving & Methodological Rigor',
          weightPercentage: 30,
          exemplary: 'Selects optimal problem-solving strategies independently; justifies each step with clear mathematical/scientific/analytical evidence.',
          proficient: 'Selects valid strategies; solves standard and multi-step problems with sound logic and clear step-by-step reasoning.',
          developing: 'Solves routine problems with guidance; struggles when encountering unfamiliar or non-routine scenarios.',
          beginning: 'Struggles to formulate an initial strategy; reasoning is disjointed or largely incomplete.'
        },
        {
          criterion: 'Communication, Representation & Defense',
          weightPercentage: 20,
          exemplary: 'Articulates conclusions with exceptional clarity using multi-modal representations (diagrams, equations, structured prose).',
          proficient: 'Clearly communicates findings and explanations using appropriate subject-specific formats and conventions.',
          developing: 'Communication is somewhat disorganized or lacks sufficient explanatory detail.',
          beginning: 'Conclusions are poorly structured, unclear, or unsupported by evidence.'
        },
        {
          criterion: 'Metacognition & Reflective Transfer',
          weightPercentage: 15,
          exemplary: 'Exhibits insightful self-assessment; evaluates alternate approaches and articulates real-world implications vividly.',
          proficient: 'Reflects on strengths and growth areas; connects findings to broader curriculum context.',
          developing: 'Surface-level reflection with limited depth on personal problem-solving trajectory.',
          beginning: 'Little to no evidence of metacognitive reflection or transfer to new domains.'
        }
      ]
    };

    const resourceList: ResourceItem[] = [
      {
        category: 'Digital',
        title: 'Interactive Conceptual Simulation & Modeling Tool',
        description: 'Interactive digital sandbox enabling students to manipulate variables, observe immediate feedback, and test hypotheses.',
        sourceOrUrl: 'Recommended Open Educational Resource (OER)'
      },
      {
        category: 'Printable',
        title: 'Tiered Scaffolded Student Guided Journal & Graphic Organizers',
        description: 'Printable lesson organizers featuring Cornell-style note-taking sections, worked examples, and retrieval check-ins.',
        sourceOrUrl: 'Curriculum Resource Repository'
      },
      {
        category: 'Lab/Hands-on',
        title: 'Collaborative Investigation Station Kit',
        description: 'Physical manipulatives, chart paper, markers, and mini-whiteboards for small-group active engagement.',
        sourceOrUrl: 'Classroom Materials Depot'
      },
      {
        category: 'Reading',
        title: 'Authentic Case Studies & Primary Source Excerpts',
        description: 'Curated high-interest articles and excerpted texts aligned with lexile levels for the target grade.',
        sourceOrUrl: 'Supplementary Literacy Anthology'
      }
    ];

    return {
      id,
      title: input.title,
      subject: input.subject,
      gradeLevel: input.gradeLevel,
      curriculumFramework: input.curriculumFramework,
      standardsFramework: input.standardsFramework || 'General Educational Standards Framework',
      durationWeeks: input.durationWeeks,
      sessionsPerWeek: input.sessionsPerWeek,
      classDurationMinutes: input.classDurationMinutes,
      format: input.format,
      unitOverview: `This comprehensive multi-week instructional plan for ${input.title} employs Backward Design (Understanding by Design) to build durable conceptual understanding, procedural fluency, and real-world transfer for ${input.gradeLevel} students. Across ${input.durationWeeks} weeks (${totalSessions} sessions), learners progress systematically from foundational principles and vocabulary through guided modeling, collaborative problem-solving, and culminate in an authentic performance task.`,
      unitObjectives: [
        `Explain the fundamental concepts, underlying principles, and key mechanisms of ${input.title} with academic precision.`,
        `Analyze and evaluate authentic scenarios by applying systematic methodologies and critical reasoning.`,
        `Collaborate effectively with peers to solve non-routine, multi-step challenges and present evidence-based conclusions.`,
        `Demonstrate independent mastery on the culminating unit performance task according to multi-tier rubric criteria.`
      ],
      prerequisiteKnowledge: input.priorKnowledge 
        ? [input.priorKnowledge, 'Basic grade-appropriate literacy and reasoning strategies']
        : ['Basic prior grade-level subject foundations', 'Introductory collaborative work norms and reflective practice'],
      studentNeeds: input.studentNeeds || 'Universal Design for Learning (UDL) multiple means of representation, expression, and engagement.',
      teachingMethods: input.preferredTeachingMethods,
      weeklyPlans,
      finalAssessment,
      resourceList,
      references: [],
      referencesStatus: 'pending',
      curriculumContext: (rawInput as any).curriculumContext || undefined,
      teacherNotes: input.teacherNotes || 'Review daily formative exit tickets at the conclusion of each session to calibrate pacing and small-group interventions.',
      status: 'draft',
      isDemo: true, // Clearly flags demo / fallback mode
      createdAt: now,
      updatedAt: now
    };
  }

  public generateSessionPlan(params: {
    planId: string;
    weekNumber: number;
    dayNumber: number;
    sessionNumber: number;
    totalSessions: number;
    topicTitle: string;
    subject: string;
    gradeLevel: string;
    durationMinutes: number;
    weekTheme: string;
    standardsFramework: string;
    enableHomework: boolean;
  }): SessionPlan {
    const {
      weekNumber,
      dayNumber,
      sessionNumber,
      totalSessions,
      topicTitle,
      subject,
      gradeLevel,
      durationMinutes,
      weekTheme,
      standardsFramework,
      enableHomework
    } = params;

    const sessionFocus = this.getSessionFocus(dayNumber, weekNumber, topicTitle, totalSessions);

    // Precise time allocation matching durationMinutes
    const timeAlloc = this.calculatePhaseTiming(durationMinutes);

    // Build bloom objectives with action verbs
    const objectives = [
      {
        id: `obj_${sessionNumber}_1`,
        description: `${sessionFocus.primaryVerb} the essential principles of ${sessionFocus.subtopic} and explain their functional relationship.`,
        bloomLevel: sessionFocus.bloomLevel as BloomLevel,
        successCriterion: `I can accurately describe ${sessionFocus.subtopic} and articulate its significance in solving contextual challenges.`
      },
      {
        id: `obj_${sessionNumber}_2`,
        description: `Demonstrate procedural accuracy when applying ${sessionFocus.subtopic} strategies during collaborative and independent practice.`,
        bloomLevel: (sessionFocus.bloomLevel === 'Remembering' ? 'Understanding' : 'Applying') as BloomLevel,
        successCriterion: `I can complete targeted practice exercises with at least 80% accuracy without teacher scaffolding.`
      }
    ];

    // Honest standards labeling
    const standards: StandardAlignment[] = [
      {
        id: `std_${sessionNumber}_1`,
        framework: standardsFramework,
        code: `${subject.substring(0, 3).toUpperCase()}.${gradeLevel.includes('10') ? '10' : '9'}.${weekNumber}.${dayNumber}`,
        description: `Demonstrate mastery of grade-level competencies relating to ${sessionFocus.subtopic} and evidence-based problem formulation.`,
        lessonConnection: `Suggested pedagogical alignment; please confirm against your official syllabus. Directly addressed through the teacher modeling and student guided practice investigating ${sessionFocus.subtopic}.`,
        verificationStatus: 'suggested_unverified' // Honest labeling: not verified against an official live DB
      }
    ];

    const lessonSequence = [
      {
        phase: 'opening' as const,
        title: 'Retrieval Warm-Up & Framing Hook',
        durationMinutes: timeAlloc.opening,
        description: `Activate prior knowledge through a 3-question retrieval warm-up connected to yesterday's concepts and introduce the driving essential question.`,
        teacherAction: `Project the retrieval prompt; circulate with a clipboard to note student baseline responses; establish lesson success criteria on the board.`,
        studentAction: `Independently record responses in their warm-up journals; participate in a brief 60-second turn-and-talk with their elbow partner.`,
        materials: ['Display screen/projector', 'Student warm-up journals', 'Timer']
      },
      {
        phase: 'direct_instruction' as const,
        title: 'Explicit Instruction & Step-by-Step Modeling ("I Do")',
        durationMinutes: timeAlloc.direct_instruction,
        description: `Introduce ${sessionFocus.subtopic} through dual-coding (visual organizer + concise explanation), explicitly thinking aloud common misconceptions and decision-making logic.`,
        teacherAction: `Deliver focused instruction using clear visual anchors; demonstrate worked examples while annotating key decision points and vocabulary.`,
        studentAction: `Complete guided fill-in notes; highlight critical rule checkpoints; ask clarifying questions during designated pause intervals.`,
        materials: ['Interactive whiteboard / slides', 'Guided notes handout']
      },
      {
        phase: 'guided_practice' as const,
        title: 'Scaffolded Guided Practice ("We Do")',
        durationMinutes: timeAlloc.guided_practice,
        description: `Guide the whole class through tiered practice problems, gradually fading prompts as student accuracy and confidence increase.`,
        teacherAction: `Pose structured practice tasks; call on cold-called pairs for rationale; utilize quick choral or whiteboard checks to gauge whole-class readiness.`,
        studentAction: `Work through scaffolded tasks on individual dry-erase whiteboards; show answers on cue; justify reasoning to the class.`,
        materials: ['Individual mini-whiteboards & dry-erase markers', 'Tiered practice slides']
      },
      {
        phase: 'collaborative_independent' as const,
        title: 'Collaborative Application & Independent Mastery ("You Do")',
        durationMinutes: timeAlloc.collaborative_independent,
        description: `Students work in structured pairs or independently on differentiated task cards applying ${sessionFocus.subtopic} to authentic contextual problems.`,
        teacherAction: `Conduct targeted small-group pull-out instruction with students needing reinforcement; facilitate extension tasks for advanced students.`,
        studentAction: `Engage with assigned tiered problem cards; verify work with partner using rubric criteria; record individual solutions in notebooks.`,
        materials: ['Differentiated task cards (Tiers 1-3)', 'Student workbooks']
      },
      {
        phase: 'formative_assessment' as const,
        title: 'Formative Check for Understanding',
        durationMinutes: timeAlloc.formative_assessment,
        description: `Conduct a focused assessment measuring mastery of today's core objective to inform tomorrow's pacing.`,
        teacherAction: `Distribute or display the formative check; observe without intervening; collect student artifacts for quick sorting into proficiency piles.`,
        studentAction: `Independently complete the formative prompt demonstrating their mastery of ${sessionFocus.subtopic}.`,
        materials: ['Formative exit ticket slips / digital response form']
      },
      {
        phase: 'closure' as const,
        title: 'Synthesis, Metacognitive Reflection & Exit Wrap-Up',
        durationMinutes: timeAlloc.closure,
        description: `Revisit the day's essential question and success criteria; students summarize the core concept in one sentence before dismissal.`,
        teacherAction: `Summarize the day's key learning; preview tomorrow's investigation; collect exit materials at the door.`,
        studentAction: `Self-assess against today's success criteria (Fist-to-Five or scale); submit exit ticket at the classroom door.`,
        materials: ['Exit ticket collection bin']
      }
    ];

    const formativeAssessment = {
      type: 'Targeted Exit Slip & Error Analysis',
      measures: `Student ability to correctly apply ${sessionFocus.subtopic} principles and identify common analytical pitfalls.`,
      promptOrQuestion: `Explain how ${sessionFocus.subtopic} operates in your own words, and solve the provided sample problem showing all intermediate steps.`,
      evidenceOfLearning: `Student produces an accurate step-by-step solution accompanied by a 1-2 sentence justification using domain-specific vocabulary.`,
      interpretationGuide: `Full credit: Correct method and vocabulary. Partial credit: Correct logic but arithmetic or minor procedural slip. Needs review: Misinterprets core rule or leaves justification blank.`,
      nextInstructionalStep: `Students with misconceptions will receive a targeted 7-minute guided warm-up mini-lesson at the start of next session.`
    };

    const differentiation = {
      support: `Provide step-by-step graphic organizer, pre-filled vocabulary bank, and worked-example reference card for continuous student guidance.`,
      onLevel: `Standard guided notes, collaborative peer dialogue protocol, and mixed difficulty task cards with solution checking.`,
      advanced: `Challenge problem set featuring non-routine edge cases, requiring students to generalize formulas or design an alternative solution path.`,
      ell: `Visual glossaries with dual-language definitions, sentence frames for verbal participation, and illustrated concept maps.`,
      modalitiesOrAccommodations: `Provide multimodal representations (color-coded diagrams, tactile manipulatives where applicable), frequent comprehension checks, and flexible pacing.`
    };

    const homework = {
      enabled: enableHomework,
      task: enableHomework 
        ? `Complete 4 reflection and practice problems applying ${sessionFocus.subtopic} in authentic scenarios.`
        : '',
      estimatedMinutes: enableHomework ? Math.min(20, Math.round(durationMinutes * 0.3)) : 0,
      optionalChallenge: enableHomework ? `Find or describe an everyday real-world example where ${sessionFocus.subtopic} is utilized.` : '',
      realWorldConnection: `Connects to industry, environmental, or scientific applications of ${topicTitle}.`
    };

    return {
      id: `sess_${params.planId}_w${weekNumber}_s${sessionNumber}`,
      sessionNumber,
      dayNumber,
      weekNumber,
      title: `Lesson ${sessionNumber}: ${sessionFocus.title}`,
      topic: sessionFocus.subtopic,
      durationMinutes,
      objectives,
      successCriteria: [
        `I can explain the significance of ${sessionFocus.subtopic}.`,
        `I can accurately execute the primary procedure with confidence.`,
        `I can self-check my work against the lesson criteria.`
      ],
      standards,
      lessonSequence,
      formativeAssessment,
      differentiation,
      homework,
      materials: [
        'Curriculum workbook / guided notes',
        'Interactive projection slides',
        'Student whiteboards & markers',
        'Formative exit tickets'
      ]
    };
  }

  private calculatePhaseTiming(totalMinutes: number) {
    // Partition totalMinutes cleanly across 6 phases so sum === totalMinutes
    // Opening: ~14%, Direct: ~30%, Guided: ~24%, Indep: ~20%, Assessment: ~8%, Closure: ~4%
    const opening = Math.max(5, Math.round(totalMinutes * 0.14));
    const direct_instruction = Math.max(8, Math.round(totalMinutes * 0.30));
    const guided_practice = Math.max(6, Math.round(totalMinutes * 0.24));
    const formative_assessment = Math.max(4, Math.round(totalMinutes * 0.08));
    const closure = Math.max(3, Math.round(totalMinutes * 0.04));
    
    // Remainder to independent
    const collaborative_independent = totalMinutes - (opening + direct_instruction + guided_practice + formative_assessment + closure);

    return {
      opening,
      direct_instruction,
      guided_practice,
      collaborative_independent: Math.max(5, collaborative_independent),
      formative_assessment,
      closure
    };
  }

  private deriveWeeklyThemes(topic: string, subject: string, weeks: number) {
    const defaultProgression = [
      {
        week: 1,
        title: `Week 1: Foundations, Key Vocabulary & Diagnostic Exploration`,
        theme: `Foundations of ${topic}`,
        focus: `Diagnostic baseline assessment, core terminology, visual models, and primary mechanics.`,
        vocab: ['Hypothesis', 'Variable', 'Framework', 'Representation', 'Foundation']
      },
      {
        week: 2,
        title: `Week 2: Guided Practice, Structural Rules & Skill Deepening`,
        theme: `Analytical Exploration of ${topic}`,
        focus: `Guided problem solving, analyzing multi-step processes, and identifying systematic patterns.`,
        vocab: ['Analysis', 'Deduction', 'Algorithm', 'Systematic', 'Correlation']
      },
      {
        week: 3,
        title: `Week 3: Collaborative Inquiry, Complex Modeling & Error Analysis`,
        theme: `In-Depth Problem Solving in ${topic}`,
        focus: `Non-routine investigations, multi-perspective debates, peer critiquing, and error diagnosis.`,
        vocab: ['Deconstruction', 'Optimization', 'Constraint', 'Validity', 'Investigation']
      },
      {
        week: 4,
        title: `Week 4: Real-World Applications, Culminating Task & Synthesis`,
        theme: `Authentic Application & Capstone Assessment`,
        focus: `Transfer to authentic contexts, project defense, cumulative review, and unit evaluation.`,
        vocab: ['Synthesis', 'Extrapolation', 'Evaluation', 'Criterion', 'Transfer']
      }
    ];

    if (weeks <= 4) {
      return defaultProgression.slice(0, weeks);
    }

    // If more than 4 weeks, generate dynamically
    const results = [...defaultProgression];
    for (let w = 5; w <= weeks; w++) {
      results.push({
        week: w,
        title: `Week ${w}: Advanced Extensions & Integrative Studies in ${topic}`,
        theme: `Extended Inquiry Phase ${w - 4}`,
        focus: `Interdisciplinary connections, student-driven research modules, and master-level challenge problems.`,
        vocab: ['Integration', 'Interdisciplinary', 'Advancement', 'Innovation', 'Critique']
      });
    }
    return results;
  }

  private getSessionFocus(dayNumber: number, weekNumber: number, topic: string, totalSessions: number) {
    const verbs = ['Identify', 'Explain', 'Compare', 'Calculate', 'Analyze', 'Design', 'Evaluate', 'Demonstrate'];
    const bloomLevels = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'];

    const dayPatterns = [
      {
        title: 'Core Concept Introduction & Structural Analysis',
        subtopic: `Conceptual Framework & Properties of ${topic}`,
        primaryVerb: 'Identify and analyze',
        bloomLevel: weekNumber === 1 ? 'Understanding' : 'Analyzing'
      },
      {
        title: 'Procedural Modeling & Guided Representation',
        subtopic: `Step-by-Step Mechanisms & Representations in ${topic}`,
        primaryVerb: 'Apply and demonstrate',
        bloomLevel: 'Applying'
      },
      {
        title: 'Collaborative Problem-Solving & Case Investigation',
        subtopic: `Multi-Step Scenarios & Problem Scaffolding`,
        primaryVerb: 'Calculate and solve',
        bloomLevel: 'Applying'
      },
      {
        title: 'Error Analysis, Edge Cases & Counter-Examples',
        subtopic: `Critical Evaluation & Diagnostic Reasoning`,
        primaryVerb: 'Analyze and critique',
        bloomLevel: 'Analyzing'
      },
      {
        title: 'Retrieval Synthesis, Reflection & Weekly Mastery Check',
        subtopic: `Consolidation & Formative Mastery Review`,
        primaryVerb: 'Evaluate and synthesize',
        bloomLevel: weekNumber === 4 ? 'Creating' : 'Evaluating'
      },
      {
        title: 'Authentic Extension & Real-World Lab Simulation',
        subtopic: `Contextual Field Application of ${topic}`,
        primaryVerb: 'Design and justify',
        bloomLevel: 'Creating'
      },
      {
        title: 'Individual Mastery Exhibition & Peer Defense',
        subtopic: `Culminating Showcase & Peer Critique`,
        primaryVerb: 'Synthesize and defend',
        bloomLevel: 'Evaluating'
      }
    ];

    const pattern = dayPatterns[(dayNumber - 1) % dayPatterns.length];
    return pattern;
  }
}
