// All site content lives here — edit this file to update the portfolio.

const SITE = {
  name: "Vansh Kulshrestha",
  email: "vanshryan@gmail.com",
  github: "https://github.com/Vansh8010-boop",
  linkedin: "https://www.linkedin.com/in/vansh-kulshrestha04/",
  resume: "assets/Vansh_Kulshrestha_Resume.pdf",
  photo: "assets/img/me.jpg",
  roles: [
    "AI / ML engineer",
    "LLM systems builder",
    "RL-for-reasoning tinkerer",
    "AI security researcher",
  ],
};

// Compact skill list shown in the Skills section.
const SKILLS = [
  { group: "AI / ML", items: ["Machine Learning", "Deep Learning", "NLP", "Transformers", "Spiking Neural Networks", "Computer Vision", "Model Evaluation", "Feature Engineering"] },
  { group: "LLMs", items: ["LLM Inference", "LLM Pre-training", "Reinforcement Learning", "RAG", "AI Agents & Tool Use", "LLM-as-a-Judge", "Prompt Engineering", "AI Security"] },
  { group: "Frameworks", items: ["PyTorch", "TensorFlow", "scikit-learn", "Hugging Face", "NumPy", "Pandas", "SpikingJelly", "FastAPI", "Streamlit"] },
  { group: "Languages", items: ["Python", "Java", "JavaScript", "SQL"] },
  { group: "Data & Deploy", items: ["Oracle AI Database", "MongoDB", "Git", "Docker", "Vercel"] },
];

// Projects. status "building" = in progress, "shipped" = done.
const PROJECTS = [
  {
    id: "mini-infer",
    status: "building",
    title: "Mini LLM Inference Engine",
    tagline: "A server that runs a language model for many users at once — written from scratch to learn how vLLM-style serving works.",
    headline: { value: "2.37×", label: "faster than Hugging Face", context: "347.8 vs 146.7 tokens/sec when 32 users chat with Qwen2.5 at the same time (ShareGPT traffic)" },
    visual: { type: "bars", unit: "tokens / sec", rows: [["Hugging Face (best config)", 146.7, "muted"], ["My engine", 347.8, "accent"]] },
    progress: 0.85, stage: "Week 5 of 5 — final benchmarks",
    links: [{ label: "Code", url: "https://github.com/Vansh8010-boop/LLM-Inference-Engine" }],
    stack: ["Python", "PyTorch", "FastAPI"],
    skills: ["LLM Inference", "PyTorch", "Transformers", "Python", "Hugging Face", "Model Evaluation", "FastAPI"],
    page: {
      problem: "Serving an LLM to many people at once is mostly a memory problem. A naive server reserves room for the longest possible reply for every user, so the GPU fills up with empty space and most users wait in line.",
      built: [
        "A paged KV cache: memory is handed out in 16-token blocks as replies grow, like virtual memory in an OS.",
        "A continuous-batching scheduler: a new request joins the running batch the moment another one finishes, instead of waiting for the whole batch.",
        "A streaming, OpenAI-compatible API, plus token-for-token correctness tests against Hugging Face.",
        "Experiments with INT8 weights (36% less memory) and speculative decoding (69% of draft tokens accepted).",
      ],
      results: [
        { img: "assets/img/kv-memory.png", caption: "Paging cuts wasted KV memory from 80.7% to 1.9%, so the same 3 GB fits 608 conversations instead of 119." },
        { img: "assets/img/kv-speedup.png", caption: "With a KV cache, the time per token stays flat instead of growing with the reply — 1.5× faster decoding on a laptop RTX 3050." },
      ],
      demo: "batching",
      honest: "INT8 and speculative decoding were correct but not faster on my setup (no fast INT8 kernel on Windows; batch-1 decoding is CPU-bound), so the 2.37× comes from paging and batching alone.",
    },
  },
  {
    id: "grpo",
    status: "building",
    title: "Teaching a Small LLM to Reason with GRPO",
    tagline: "The reinforcement-learning recipe behind DeepSeek-R1, written from scratch and run on free Kaggle GPUs to make a small model better at math.",
    headline: { value: "83.4% → 88.4%", label: "on practice problems, but flat on the real test", context: "Qwen2.5-1.5B after 350 GRPO steps. The held-out GSM8K test didn't move (75.8% → 75.7%), so I'm now finding out why" },
    visual: { type: "pairs", unit: "accuracy before → after GRPO (1.5B)", min: 50, max: 92, rows: [["Practice set (train split)", 83.4, 88.4], ["GSM8K test", 75.8, 75.7], ["SVAMP test", 83.4, 85.3], ["MATH-500 test", 56.4, 56.8]] },
    progress: 0.67, stage: "Week 5 of 6 — fixing collapse and building a test-like validation set",
    links: [{ label: "Code", url: "https://github.com/Vansh8010-boop/grpo-reasoning" }],
    stack: ["Python", "PyTorch", "LoRA", "vLLM"],
    skills: ["Reinforcement Learning", "LLM Inference", "PyTorch", "Transformers", "Python", "Model Evaluation", "Hugging Face"],
    page: {
      problem: "Small models often know enough math but don't reason carefully. GRPO trains them by letting them try a problem several times, rewarding the attempts that reach the right answer, and nudging the model toward those.",
      built: [
        "An evaluation harness and answer parser for GSM8K, MATH-500 and SVAMP (baseline 1.5B model: 75.8% / 55.8% / 83.2%).",
        "Verifiable rewards: +1.0 for a correct final answer, +0.2 for the right format.",
        "The GRPO loss and training loop with LoRA, without any RL library, running on two free Kaggle T4 GPUs.",
        "Monitoring that caught a failure greedy accuracy hid: at a higher learning rate the model collapsed into garbage tokens after step 150.",
        "Scaled to the 1.5B model with a vLLM rollout worker on the second GPU, after filtering out 3,137 problems the model always solved.",
      ],
      results: [
        { img: "assets/img/grpo-week3.png", caption: "Week 3 runs on the 0.5B model, measured on the practice set. Blue (lr 1e-5) keeps improving; orange (lr 3e-5) drifts away from the reference model (KL, top right) and its accuracy stalls." },
      ],
      demo: "grpo",
      honest: "The 1.5B model's gains on practice problems didn't carry over to the test sets: GSM8K stayed flat (75.8% → 75.7%), and SVAMP (83.4% → 85.3%) and MATH-500 (56.4% → 56.8%) rose by amounts that aren't statistically significant. The base model already scores about 8 points higher on training-split problems of the same difficulty, which suggests it has seen them before. It also still collapses into garbage tokens after about 330 steps. Week 5 builds a validation set that looks like the test and tries to stop the collapse.",
    },
  },
  {
    id: "snn",
    status: "shipped",
    title: "Spiking Neural Network from Scratch",
    tagline: "Brain-style neurons that communicate in spikes — built in NumPy first, then scaled up on the GPU.",
    headline: { value: "7× fewer", label: "operations than a regular network", context: "97.9% on MNIST digits vs 97.4% for a same-size standard network, using 33K instead of 235K synaptic operations per image" },
    visual: { type: "bars", unit: "synaptic ops per image (thousands)", rows: [["Standard network", 235, "muted"], ["Spiking network", 33, "accent"]] },
    links: [{ label: "Code", url: "https://github.com/Vansh8010-boop/Spiking-Neural-Network" }],
    stack: ["Python", "PyTorch", "NumPy", "SpikingJelly"],
    skills: ["Spiking Neural Networks", "Deep Learning", "PyTorch", "NumPy", "SpikingJelly", "Python", "Model Evaluation"],
    page: {
      problem: "Spiking networks only do work when a neuron fires, which could make AI far cheaper on neuromorphic hardware. I wanted to understand the trade-off between accuracy and compute myself.",
      built: [
        "Leaky integrate-and-fire neurons with rate, temporal and population spike encoding, in plain NumPy.",
        "A GPU multi-layer SNN trained with surrogate gradients in SpikingJelly.",
        "Tests on still images (MNIST) and event-camera data (N-MNIST: 90–95%, CIFAR10-DVS: 60–75%).",
      ],
      results: [
        { img: "assets/img/snn-vs-ann.png", caption: "Same accuracy as a standard network, about 7× fewer operations, and 76% of neurons silent at any moment." },
        { img: "assets/img/snn-training.png", caption: "Training curves, and which neurons fire over 10 timesteps." },
      ],
      demo: "lif",
    },
  },
  {
    id: "docket",
    status: "shipped",
    title: "Docket",
    tagline: "Drop in a PDF or a photo of a document and get a summary, key points and keywords — all inside your browser.",
    headline: { value: "Offline", label: "summaries with no server and no API key", context: "in Quick mode, PDF parsing, OCR and summarizing all run in your browser; an optional Gemini mode writes summaries in its own words" },
    visual: { type: "image", src: "assets/img/docket.jpg", alt: "Docket app screenshot" },
    links: [{ label: "Live demo", url: "https://docket-assessment.vercel.app/", primary: true }, { label: "Code", url: "https://github.com/Vansh8010-boop/Docket" }],
    stack: ["JavaScript", "PDF.js", "Tesseract.js"],
    skills: ["NLP", "JavaScript", "Computer Vision"],
    page: {
      problem: "Most summarizers upload your file to someone's server and need an account or API key. Docket works the moment the page loads.",
      built: [
        "Text extraction from PDFs with PDF.js, keeping line and paragraph structure.",
        "In-browser OCR with Tesseract.js for scanned images.",
        "My own extractive summarizer (word-frequency scoring with a bonus for early sentences), with short / medium / long lengths.",
        "An optional AI mode that sends the text to Gemini with the user's own key for a rewritten summary, key points and keywords.",
      ],
      demo: "iframe", iframe: "https://docket-assessment.vercel.app/",
    },
  },
  {
    id: "researchpilot",
    status: "shipped",
    title: "ResearchPilot",
    tagline: "An AI agent that plans a research question, searches the web, reads pages and writes an answer — with guard-rails so it can't be hijacked or loop forever.",
    headline: { value: "90.9%", label: "of research runs passed so far", context: "LLM-judge score on 22 of 45 planned benchmark runs (95.5% by the automatic grader); 97.8% of tool calls succeeded. Benchmark still running" },
    visual: { type: "flow", steps: ["Plan", "Search", "Read", "Calculate", "Answer", "Judge"] },
    links: [{ label: "Live demo", url: "https://researchpilot-taupe.vercel.app/", primary: true }, { label: "Code", url: "https://github.com/Vansh8010-boop/ResearchPilot" }],
    stack: ["Python", "FastAPI", "Streamlit", "Tavily", "Docker"],
    skills: ["AI Agents & Tool Use", "LLM-as-a-Judge", "Prompt Engineering", "AI Security", "Python", "FastAPI", "Streamlit", "Docker", "Model Evaluation"],
    page: {
      problem: "Agents that browse the web are fragile: pages can contain instructions that hijack them, tools fail, and loops run away. I wanted an agent I could actually measure.",
      built: [
        "A plan-and-execute loop with web search, page retrieval and a calculator tool.",
        "Prompt-injection defenses, tool-level error handling and iteration limits.",
        "LLM-as-a-judge scoring on a fixed benchmark, with failure analysis to guide prompt fixes.",
      ],
      honest: "These are partial results from 22 of 45 planned runs, because the free Groq tier limits how many can run per day. They come from the baseline with defenses off, and the agent followed an injected instruction in 1 of 2 runs on an attack task. The runs comparing defenses on and off haven't happened yet, and the LLM judge isn't calibrated against hand labels yet.",
    },
  },
  {
    id: "traffic",
    status: "shipped",
    title: "Smart Adaptive Traffic Signals",
    tagline: "Counts cars and pedestrians from CCTV with YOLOv8 and changes how long each light stays green.",
    headline: { value: "Real-time", label: "signal timing from live video", context: "green time is set from vehicle and pedestrian counts at each approach, with an admin dashboard to monitor it" },
    visual: { type: "detect" },
    links: [{ label: "Code", url: "https://github.com/Vansh8010-boop/Smart-Adaptive-Traffic-Management-System" }],
    stack: ["Python", "YOLOv8", "OpenCV"],
    skills: ["Computer Vision", "Python", "Deep Learning"],
    page: {
      problem: "Fixed-timer traffic lights waste green time on empty roads. Cameras already exist at most junctions.",
      built: [
        "YOLOv8 detection of vehicles and pedestrians from CCTV frames.",
        "A timing rule that sets each approach's green time from its live count, with emergency handling.",
        "A simulator and admin GUI to watch and override the system.",
      ],
    },
  },
];

const EXPERIENCE = [
  {
    id: "personifwy",
    role: "Artificial Intelligence Intern",
    org: "Personifwy",
    where: "Bangalore",
    when: "Mar – Apr 2024",
    summary: "Trained a 500-million-parameter language model end to end for the team's customer-personalization work.",
    points: [
      "Built the data preparation, tokenization and training pipeline.",
      "Ran GPU training with checkpointing; tuned learning rate and batch size from the loss curves.",
      "Picked the final model by evaluating checkpoints on held-out data.",
    ],
    skills: ["LLM Pre-training", "Transformers", "PyTorch"],
  },
  {
    id: "foxtrading",
    role: "Machine Learning Intern",
    org: "Fox Trading",
    where: "Bangalore",
    when: "Mar – Apr 2024",
    summary: "Built a model that predicts parking availability from historical occupancy data.",
    points: [
      "Engineered time-based features (hour, weekday, recurring demand) and compared several regression models.",
      "Validated on held-out time periods to make sure it worked on unseen data.",
    ],
    skills: ["Machine Learning", "Feature Engineering", "scikit-learn", "Pandas"],
  },
];

const EDUCATION = [
  {
    degree: "B.Tech, Computer Science & Engineering",
    focus: "Specialization in Artificial Intelligence & Machine Learning",
    school: "VIT-AP University",
    where: "Amaravati, Andhra Pradesh",
    when: "2023 – 2027",
    note: "Final year",
  },
];

const CERTS = [
  {
    id: "oracle-cert",
    title: "Oracle Autonomous AI Database Certified Professional",
    issuer: "Oracle",
    date: "July 2026",
    credential: "103491514OAAIDB26CP",
    badge: "assets/img/oracle-badge.jpg",
    image: "assets/img/oracle-cert.jpg",
    pdf: "assets/Oracle_Autonomous_AI_Database_Certified_Professional.pdf",
  },
];
