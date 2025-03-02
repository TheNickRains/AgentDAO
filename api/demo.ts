import { VercelRequest, VercelResponse } from '@vercel/node';

interface Proposal {
  id: string;
  title: string;
  summary: string;
  options: string[];
  deadline: string;
}

interface EmailDigest {
  proposals: Proposal[];
  aiRecommendation: string;
  userPreferences: string[];
}

const mockProposals: Proposal[] = [
  {
    id: "PROP-001",
    title: "Treasury Diversification Strategy",
    summary: "Proposal to allocate 20% of treasury to stablecoin yield farming across multiple chains.",
    options: ["For", "Against", "Abstain"],
    deadline: "2024-03-15"
  },
  {
    id: "PROP-002",
    title: "Cross-Chain Governance Bridge",
    summary: "Implementation of Chainlink CCIP for unified governance across Base, Ethereum, and Optimism.",
    options: ["For", "Against", "Abstain"],
    deadline: "2024-03-20"
  },
  {
    id: "PROP-003",
    title: "Community Growth Initiative",
    summary: "Allocation of 100k USDC for marketing and community engagement programs.",
    options: ["For", "Against", "Abstain"],
    deadline: "2024-03-25"
  }
];

const mockEmailDigest: EmailDigest = {
  proposals: mockProposals,
  aiRecommendation: "Based on your voting history and the community discussion, we recommend voting FOR PROP-002 as it aligns with your previous support for cross-chain infrastructure improvements.",
  userPreferences: ["Cross-chain infrastructure", "Treasury management", "Community growth"]
};

const simulateEmailWorkflow = async () => {
  const steps = [
    {
      step: "Fetching active proposals",
      data: mockProposals.map(p => p.title)
    },
    {
      step: "Analyzing user preferences",
      data: mockEmailDigest.userPreferences
    },
    {
      step: "Generating AI recommendations",
      data: mockEmailDigest.aiRecommendation
    },
    {
      step: "Preparing email digest",
      data: "Email digest ready for delivery"
    },
    {
      step: "Simulating user vote",
      data: {
        proposal: "PROP-002",
        vote: "FOR",
        method: "email reply"
      }
    },
    {
      step: "Processing cross-chain execution",
      data: {
        sourceChain: "Base",
        destinationChain: "Optimism",
        ccipMessageId: "0x123...abc",
        status: "confirmed"
      }
    }
  ];

  return steps;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const workflowSteps = await simulateEmailWorkflow();
    res.status(200).json({
      status: "success",
      message: "Demo workflow completed successfully",
      workflow: workflowSteps
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to run demo workflow",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
} 