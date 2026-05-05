// ————————————————————————————————————————————————————————————
// Scale items & correlate registry.
// r-values are COMPUTED from the raw N=956 dataset (this page).
// Item means are descriptive stats from the same dataset.
// ————————————————————————————————————————————————————————————

window.WCHS_META = {
  n: 956,
  mean: 59.81,
  sd: 20.71,
};

window.WCHS_ITEMS = [
  { t: "I could be left emotionally scarred by something I read.",                                                    m: 45.45, sd: 29.44 },
  { t: "I could be traumatized without ever being touched, just through someone's hurtful words.",                     m: 59.00, sd: 30.37 },
  { t: "Reading a book can be emotionally damaging, depending on who is reading it.",                                 m: 51.96, sd: 27.82 },
  { t: "A person might develop posttraumatic stress disorder, or some of its symptoms, from something they read.",    m: 47.02, sd: 27.34 },
  { t: "I should be careful about what I say, as it could permanently damage someone's emotional health.",            m: 66.05, sd: 26.63 },
  { t: "Vulnerable people should not be exposed to certain kinds of speech, as this might harm them.",                m: 53.84, sd: 27.08 },
  { t: "Even if I try to think about them in a different way, hurtful words could be damaging nonetheless.",          m: 68.93, sd: 24.88 },
  { t: "Exposing someone to a triggering idea can seriously damage their mental health.",                             m: 62.27, sd: 26.89 },
  { t: "There is great power in the words we choose, either to heal others or to permanently harm them.",             m: 77.19, sd: 22.32 },
  { t: "Even a simple phrase can be emotionally traumatizing for someone vulnerable.",                                m: 66.40, sd: 25.84 },
];

// Correlate registry — `r` is what we compute from the raw dataset (N=956, pairwise).
window.WCHS_CORRELATES = [
  // SOCIAL / MORAL
  { key: 'LWA_TDC',              label: 'Top-down censorship (LWA)',          group: 'social',      r: 0.517, n: 956, desc: 'Support for using institutional power — governments, universities, employers — to suppress speech seen as hateful or harmful. A subscale of left-wing authoritarianism.' },
  { key: 'LWA',                  label: 'Left-wing authoritarianism',         group: 'social',      r: 0.439, n: 956, desc: 'A broad measure of authoritarian attitudes that emerge on the political left, combining hostility toward perceived oppressors, rejection of traditional norms, and support for censoring offensive speech.' },
  { key: 'CPC',                  label: 'Concern for political correctness',  group: 'social',      r: 0.420, n: 956, desc: 'How emotionally invested someone is in calling out and avoiding politically incorrect language.' },
  { key: 'TW',                   label: 'Endorses trigger warnings',          group: 'social',      r: 0.417, n: 955, desc: 'Whether the person thinks trigger warnings should be given before potentially distressing material.' },
  { key: 'SS',                   label: 'Endorses safe spaces',               group: 'social',      r: 0.384, n: 956, desc: 'Whether the person thinks college classrooms should be designated as "safe spaces" — places intended to be free of conflict, criticism, or threatening ideas.' },
  { key: 'BISO',                 label: 'Belief in importance of silencing others',  group: 'social',      r: 0.357, n: 956, desc: 'The belief that it is important — even a civic duty — to actively silence people who express views one considers harmful or illegitimate.' },
  { key: 'LWA_AC',               label: 'Anti-conventionalism (LWA)',         group: 'social',      r: 0.310, n: 956, desc: 'Rejection of traditional values, conventions, and ideological opponents (e.g., believing that "old-fashioned ways need to be abolished"). A subscale of left-wing authoritarianism.' },
  { key: 'PoliticalIdeology',    label: 'Political liberalism',               group: 'social',      r: 0.287, n: 956, desc: 'Where the person places themselves on the liberal–conservative spectrum.' },
  { key: 'Party',                label: 'Democrat (vs. Republican)',          group: 'social',      r: 0.254, n: 634, desc: 'Whether the person identifies as a Democrat rather than a Republican. Independents, Libertarians, and others are excluded from this comparison.' },
  { key: 'LWA_AHA',              label: 'Anti-hierarchical aggression (LWA)', group: 'social',      r: 0.200, n: 956, desc: 'Willingness to use aggression or even violence against people seen as powerful oppressors (e.g., "the rich should be stripped of their belongings"). A subscale of left-wing authoritarianism.' },
  { key: 'MoralGrandstanding',   label: 'Moral grandstanding',                group: 'social',      r: 0.193, n: 956, desc: 'The tendency to express moral and political views in order to gain status, look virtuous, or shame opponents — rather than to persuade or inform.' },
  { key: 'VSA',                  label: 'Right-wing authoritarianism',        group: 'social',      r: -0.048, n: 956, desc: 'Submission to traditional authorities, support for strict laws and discipline, and adherence to conventional moral norms.' },

  // CLINICAL
  { key: 'PPV_S',                label: 'Feels personally vulnerable to trauma',  group: 'clinical', r: 0.398, n: 956, desc: 'After reading a hypothetical traumatic scenario, how likely the person thinks they would be to develop lasting symptoms like flashbacks, nightmares, or losing their grip on reality.' },
  { key: 'PPV_O',                label: 'Sees others as vulnerable to trauma',    group: 'clinical', r: 0.338, n: 956, desc: 'After reading a hypothetical traumatic scenario, how likely the person thinks the average person would be to develop lasting psychological symptoms.' },
  { key: 'ASI',                  label: 'Anxiety sensitivity',                group: 'clinical',    r: 0.322, n: 956, desc: 'Fear of one\'s own anxiety-related bodily sensations — for example, worrying that a racing heart means a heart attack, or that feeling shaky means something is seriously wrong.' },
  { key: 'DERS',                 label: 'Emotion dysregulation',              group: 'clinical',    r: 0.207, n: 956, desc: 'Difficulty understanding, accepting, and managing one\'s emotions when upset — e.g., losing control, having trouble concentrating, or feeling unable to recover.' },
  { key: 'GAD7',                 label: 'Anxiety symptoms',                   group: 'clinical',    r: 0.205, n: 956, desc: 'Severity of generalized anxiety symptoms — feeling nervous, unable to stop worrying, or on edge — over the past two weeks.' },
  { key: 'PHQ9',                 label: 'Depression symptoms',                group: 'clinical',    r: 0.162, n: 956, desc: 'Severity of depressive symptoms — low mood, loss of interest, fatigue, sleep problems — over the past two weeks.' },
  { key: 'BRS',                  label: 'Resilience',                         group: 'clinical',    r: -0.170, n: 956, desc: 'How readily the person feels they bounce back from stress and difficult events.' },

  // PERSONALITY
  { key: 'Empathy',              label: 'Empathic concern',                   group: 'personality', r: 0.316, n: 956, desc: 'Other-oriented warmth and concern for people in distress — feeling sympathetic, soft-hearted, and protective when others are suffering. A subscale of the Interpersonal Reactivity Index.' },
  { key: 'TIV_NFR',              label: 'Need for recognition of suffering (TIV)',  group: 'personality', r: 0.266, n: 956, desc: 'A strong need for one\'s own pain and grievances to be seen, acknowledged, and validated by others. A subscale of the Tendency for Interpersonal Victimhood.' },
  { key: 'TIV_Rum',              label: 'Rumination over offenses (TIV)',     group: 'personality', r: 0.247, n: 956, desc: 'Repeatedly replaying past offenses and the wrongs others have done to oneself. A subscale of the Tendency for Interpersonal Victimhood.' },
  { key: 'TIV',                  label: 'Tendency For Interpersonal Victimhood (TIV)', group: 'personality', r: 0.243, n: 956, desc: 'A general disposition to view oneself as a victim across many interpersonal situations — combining a need for recognition, moral elitism, lack of empathy for adversaries, and rumination over offenses.' },
  { key: 'TIV_ME',               label: 'Moral elitism (TIV)',                group: 'personality', r: 0.217, n: 956, desc: 'Seeing oneself as morally pure and well-intentioned while seeing one\'s adversaries as immoral. A subscale of the Tendency for Interpersonal Victimhood.' },
  { key: 'IntellectualHumility', label: 'Intellectual humility',              group: 'personality', r: 0.180, n: 956, desc: 'Willingness to acknowledge that one\'s own beliefs might be wrong and openness to revising them in light of new evidence.' },
  { key: 'Agreeableness',        label: 'Agreeableness',                      group: 'personality', r: 0.142, n: 956, desc: 'A warm, sympathetic, cooperative interpersonal style.' },
  { key: 'TIV_LoE',              label: 'Lack of empathy for adversaries (TIV)',    group: 'personality', r: 0.075, n: 956, desc: 'Difficulty empathizing with the perspective of one\'s adversaries — e.g., assuming people who criticize you are acting in bad faith. A subscale of the Tendency for Interpersonal Victimhood.' },
  { key: 'Openness',             label: 'Openness',                           group: 'personality', r: 0.072, n: 956, desc: 'Curiosity, intellectual breadth, and openness to new experiences and ideas.' },
  { key: 'Extraversion',         label: 'Extraversion',                       group: 'personality', r: 0.031, n: 956, desc: 'A sociable, energetic, outgoing interpersonal style.' },
  { key: 'Conscientiousness',    label: 'Conscientiousness',                  group: 'personality', r: -0.034, n: 956, desc: 'Being dependable, organized, and self-disciplined.' },
  { key: 'GSE',                  label: 'General self-efficacy',              group: 'personality', r: -0.044, n: 956, desc: 'Confidence in one\'s ability to solve problems, cope with setbacks, and handle whatever comes one\'s way.' },
  { key: 'EmotionalStability',   label: 'Emotional stability',                group: 'personality', r: -0.179, n: 956, desc: 'Tendency to stay calm and even-keeled rather than feeling anxious or easily upset.' },

  // DEMOGRAPHIC
  { key: 'Gender',               label: 'Gender (female vs. male)',           group: 'demo',        r: 0.190, n: 942, desc: 'Whether the respondent is female or male. Respondents who identified as another gender are excluded from this comparison.' },
  { key: 'Race',                 label: 'Race (White vs. non-White)',         group: 'demo',        r: -0.104, n: 956, desc: 'Whether the respondent identifies as White or as a person of color. A negative correlation means non-White respondents tend to score higher on the WCHS.' },
  { key: 'Age',                  label: 'Age',                                group: 'demo',        r: -0.099, n: 955, desc: 'How old the respondent is, in years.' },
  { key: 'SES',                  label: 'Household income',                   group: 'demo',        r: 0.034, n: 944, desc: 'Total household income over the past 12 months — a proxy for socioeconomic status.' },
  { key: 'Education',            label: 'Education',                          group: 'demo',        r: 0.031, n: 954, desc: 'The highest level of formal education the respondent has completed.' },
];

window.GROUP_LABELS = {
  social:      'Social & political beliefs',
  clinical:    'Clinical & trauma-related',
  personality: 'Personality',
  demo:        'Demographics',
};

// Correlate variable metadata for scatter plots.
// xlabel describes the coding, range, and direction of the X axis.
window.CORR_META = {
  LWA_TDC:              { min: 1,  max: 7,   xlabel: '1–7 · higher = stronger support for top-down censorship' },
  LWA:                  { min: 1,  max: 7,   xlabel: '1–7 · higher = more left-wing authoritarian attitudes' },
  LWA_AHA:              { min: 1,  max: 7,   xlabel: '1–7 · higher = stronger endorsement of aggression against perceived oppressors' },
  LWA_AC:               { min: 1,  max: 7,   xlabel: '1–7 · higher = stronger rejection of traditional norms and opponents' },
  CPC:                  { min: 1,  max: 7,   xlabel: '1–7 · higher = greater concern for political correctness' },
  BISO:                 { min: 1,  max: 7,   xlabel: '1–7 · higher = stronger belief in silencing harmful viewpoints' },
  MoralGrandstanding:   { min: 1,  max: 7,   xlabel: '1–7 · higher = greater tendency toward moral grandstanding' },
  VSA:                  { min: 1,  max: 9,   xlabel: '1–9 · higher = more right-wing authoritarian attitudes' },
  PoliticalIdeology:    { min: 1,  max: 7,   xlabel: '1 = very conservative → 7 = very liberal' },
  Party:                { min: 0,  max: 1,   xlabel: '0 = Republican, 1 = Democrat (Independents and others excluded)' },
  TW:                   { min: 1,  max: 2,   xlabel: '1 = does not endorse trigger warnings, 2 = endorses' },
  SS:                   { min: 1,  max: 2,   xlabel: '1 = does not endorse safe spaces, 2 = endorses' },
  PPV_S:                { min: 0,  max: 100, xlabel: '0–100 · higher = sees self as more vulnerable to lasting trauma' },
  PPV_O:                { min: 0,  max: 100, xlabel: '0–100 · higher = sees others as more vulnerable to lasting trauma' },
  ASI:                  { min: 0,  max: 64,  xlabel: '0–64 · higher = more fear of anxiety-related sensations' },
  DERS:                 { min: 1,  max: 5,   xlabel: '1–5 · higher = more difficulty regulating emotions' },
  GAD7:                 { min: 0,  max: 21,  xlabel: '0–21 · higher = more severe anxiety symptoms (past 2 weeks)' },
  PHQ9:                 { min: 0,  max: 27,  xlabel: '0–27 · higher = more severe depression symptoms (past 2 weeks)' },
  BRS:                  { min: 1,  max: 5,   xlabel: '1–5 · higher = greater perceived resilience' },
  Empathy:              { min: 1,  max: 5,   xlabel: '1–5 · higher = more empathic concern for others' },
  TIV:                  { min: 1,  max: 7,   xlabel: '1–7 · higher = stronger tendency to view oneself as a victim' },
  TIV_NFR:              { min: 1,  max: 7,   xlabel: '1–7 · higher = greater need for one\'s suffering to be recognized' },
  TIV_ME:               { min: 1,  max: 7,   xlabel: '1–7 · higher = stronger sense of one\'s own moral superiority' },
  TIV_LoE:              { min: 1,  max: 7,   xlabel: '1–7 · higher = less empathy for one\'s adversaries' },
  TIV_Rum:              { min: 1,  max: 7,   xlabel: '1–7 · higher = more rumination over past offenses' },
  EmotionalStability:   { min: 1,  max: 7,   xlabel: '1–7 · higher = calmer and less easily upset' },
  Agreeableness:        { min: 1,  max: 7,   xlabel: '1–7 · higher = warmer and more cooperative' },
  Openness:             { min: 1,  max: 7,   xlabel: '1–7 · higher = more open to new experiences and ideas' },
  Conscientiousness:    { min: 1,  max: 7,   xlabel: '1–7 · higher = more dependable and self-disciplined' },
  Extraversion:         { min: 1,  max: 7,   xlabel: '1–7 · higher = more sociable and outgoing' },
  GSE:                  { min: 1,  max: 4,   xlabel: '1–4 · higher = more confidence in handling challenges' },
  IntellectualHumility: { min: 1,  max: 5,   xlabel: '1–5 · higher = more willingness to acknowledge being wrong' },
  Gender:               { min: 0,  max: 1,   xlabel: '0 = Male, 1 = Female (other genders excluded)' },
  Race:                 { min: 0,  max: 1,   xlabel: '0 = non-White, 1 = White' },
  Age:                  { min: 18, max: 85,  xlabel: 'Age in years · higher = older' },
  Education:            { min: 1,  max: 6,   xlabel: '1 = less than high school → 6 = graduate degree' },
  SES:                  { min: 1,  max: 6,   xlabel: '1 = lowest income bracket → 6 = highest income bracket' },
};
