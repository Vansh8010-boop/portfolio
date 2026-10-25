// All site content lives here — edit this file to update the portfolio.

const SITE = {
  name: "Vansh Kulshrestha",
  email: "vanshryan@gmail.com",
  github: "https://github.com/Vansh8010-boop",
  linkedin: "https://www.linkedin.com/in/vansh-kulshrestha04/",
  roles: [
    "AI / ML engineer",
    "LLM systems builder",
    "RL-for-reasoning tinkerer",
    "AI security researcher",
    "spiking-neural-net enjoyer",
  ],
};

// Skill groups. Names must match the `skills` arrays on projects for the click-to-filter to work.
const SKILLS = [
  { group: "AI / ML", icon: "∿", items: ["Machine Learning", "Deep Learning", "NLP", "Transformers", "Spiking Neural Networks", "Model Evaluation", "Feature Engineering", "Data Preprocessing"] },
  { group: "LLMs & GenAI", icon: "⌬", items: ["LLM Pre-training", "LLM Inference", "Reinforcement Learning", "RAG", "AI Agents & Tool Use", "LLM-as-a-Judge", "Prompt Engineering", "Adversarial ML & AI Security"] },
  { group: "Frameworks", icon: "▣", items: ["PyTorch", "TensorFlow", "scikit-learn", "Hugging Face", "NumPy", "Pandas", "SpikingJelly", "FastAPI", "Streamlit"] },
  { group: "Languages", icon: "λ", items: ["Python", "Java", "JavaScript", "SQL"] },
  { group: "Data & Deploy", icon: "⛁", items: ["Oracle AI Database", "MongoDB", "Git", "Docker", "Render", "Vercel"] },
];

// In-progress work. `progress` is 0–1; `log` is shown as a mini changelog.
const RUNNING = [
  {
    id: "mini-infer",
    pid: 4127,
    title: "Mini LLM Inference Engine",
    blurb: "A serving engine for Qwen2.5 written from scratch: paged KV cache, continuous batching and a streaming server — the ideas behind vLLM, rebuilt to understand them.",
    metric: { value: "2.37×", label: "throughput vs best HF baseline" },
    detail: "347.8 tok/s vs 146.7 tok/s on ShareGPT, 32 concurrent users",
    progress: 0.85,
    stage: "Week 5 / 5 · final benchmark sweep",
    log: [
      "✓ paged attention + block allocator",
      "✓ continuous batching scheduler",
      "✓ INT8 weights: −36% memory",
      "✓ speculative decoding: 69% acceptance @ k=2",
      "▶ final sweep + write-up",
    ],
    skills: ["LLM Inference", "PyTorch", "Transformers", "Python", "Hugging Face", "Model Evaluation"],
    repo: "https://github.com/Vansh8010-boop/LLM-Inference-Engine",
  },
  {
    id: "grpo",
    pid: 5310,
    title: "Teaching a Small LLM to Reason with GRPO",
    blurb: "Group Relative Policy Optimization implemented from scratch in PyTorch with LoRA, training Qwen2.5 to solve math word problems better — the RL recipe behind DeepSeek-R1, at laptop-and-Kaggle scale.",
    metric: { value: "75.8%", label: "GSM8K baseline to beat (1.5B)" },
    detail: "baselines: 55.8% MATH-500 · 83.2% SVAMP",
    progress: 0.36,
    stage: "Week 3 / 6 · GRPO training loop",
    log: [
      "✓ eval harness + answer parser",
      "✓ correctness + format rewards",
      "✓ batched rollouts on 2× T4",
      "▶ GRPO loss + training loop",
      "· reward-hacking analysis",
    ],
    skills: ["Reinforcement Learning", "LLM Inference", "PyTorch", "Transformers", "Python", "Model Evaluation", "Hugging Face"],
    repo: "https://github.com/Vansh8010-boop/grpo-reasoning",
  },
];

const PROJECTS = [
  {
    id: "researchpilot",
    title: "ResearchPilot",
    kind: "Autonomous research agent",
    blurb: "A plan-and-execute agent with web search, page retrieval and calculator tools. Hardened with prompt-injection defenses, tool-level error handling and iteration limits so it can't loop forever.",
    metrics: [["80–85%", "task success (15-task bench)"], ["~90%", "successful tool calls"]],
    stack: ["Python", "FastAPI", "Streamlit", "Tavily", "Docker"],
    skills: ["AI Agents & Tool Use", "LLM-as-a-Judge", "Prompt Engineering", "Adversarial ML & AI Security", "Python", "FastAPI", "Streamlit", "Docker", "Model Evaluation"],
  },
  {
    id: "snn",
    title: "Spiking Neural Network from Scratch",
    kind: "Neuromorphic computing",
    blurb: "Leaky integrate-and-fire neurons with rate, temporal and population spike encoding in NumPy, then scaled to a GPU multi-layer SNN. The background of this site is a tiny version of it.",
    metrics: [["~95%", "MNIST"], ["90–95%", "N-MNIST"], ["60–75%", "CIFAR10-DVS"]],
    stack: ["Python", "PyTorch", "NumPy", "SpikingJelly"],
    skills: ["Spiking Neural Networks", "Deep Learning", "PyTorch", "NumPy", "SpikingJelly", "Python", "Model Evaluation", "Data Preprocessing"],
  },
  {
    id: "legal",
    title: "Legal Document Summarizer",
    kind: "Abstractive summarization",
    blurb: "Turns long legal PDFs into structured, plain-English summaries — extraction, chunking, summarization and aggregation so multi-page contracts fit through a fixed-context model.",
    metrics: [["0.35–0.50", "ROUGE-L on CUAD"], ["0.15–0.30", "BLEU"]],
    stack: ["Python", "Streamlit", "Hugging Face", "BART / LED"],
    skills: ["NLP", "Transformers", "Hugging Face", "Streamlit", "Python", "Data Preprocessing", "Model Evaluation"],
  },
];

const EXPERIENCE = [
  {
    role: "Artificial Intelligence Intern",
    org: "Personifwy",
    where: "Bangalore",
    when: "Mar – Apr 2024",
    project: "500M-parameter language model training",
    points: [
      "Trained a 500M-parameter transformer end to end — data prep, tokenization and the training pipeline.",
      "Ran GPU training with checkpointing; tuned learning rate and batch size from the loss curves for stable convergence.",
      "Evaluated checkpoints on held-out data to pick the final model for the team's customer-personalization work.",
    ],
    skills: ["LLM Pre-training", "Transformers", "PyTorch"],
  },
  {
    role: "Machine Learning Intern",
    org: "Fox Trading",
    where: "Bangalore",
    when: "Mar – Apr 2024",
    project: "Parking availability predictor",
    points: [
      "Built a model to predict parking availability from historical occupancy data, alongside senior analysts.",
      "Engineered time-based features (hour, weekday, recurring demand) and compared several regression models.",
      "Validated on held-out time periods to confirm it held up on unseen data.",
    ],
    skills: ["Machine Learning", "Feature Engineering", "scikit-learn", "Pandas"],
  },
  {
    role: "B.Tech, Computer Science & Engineering (AI & ML)",
    org: "VIT-AP University",
    where: "Amaravati",
    when: "2023 – 2027",
    project: null,
    points: [],
    skills: [],
  },
];

// Certifications. `link` points to the credential; add more entries as you earn them.
const CERTS = [
  {
    title: "Oracle Autonomous AI Database and Machine Learning Essentials",
    issuer: "Oracle",
    blurb: "Covers Oracle's Autonomous AI Database and the machine learning tools built into it.",
    skills: ["Oracle AI Database", "Machine Learning"],
    link: "https://misty-glitter-963.linkyhost.com/",
  },
];
