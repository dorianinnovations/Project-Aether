/**
 * Dynamic Prompt Templates
 * Three archetypal directions for intelligent conversation exploration
 */

export interface PromptOption {
  id: string;
  displayText: string;
  hiddenPrompt: string;
  archetype: 'expand' | 'deepen' | 'flip';
  category: string;
}

export interface ConversationContext {
  topics: string[];
  emotionalTone: 'analytical' | 'reflective' | 'curious' | 'challenged' | 'excited';
  complexity: 'surface' | 'intermediate' | 'deep';
  recentThemes: string[];
  userStyle: 'direct' | 'exploratory' | 'philosophical' | 'practical';
  conversationLength: number;
}

/**
 * EXPAND Archetype - Broaden horizons and discover connections
 */
export class ExpandPrompts {
  static generate(context: ConversationContext): PromptOption[] {
    const templates = [
      {
        condition: () => context.topics.length > 0,
        displayText: "Discover similar concepts?",
        hiddenPrompt: `Based on our discussion about ${context.topics.join(', ')}, research 3 related concepts that share similar underlying principles but apply to different domains. Focus on practical applications and unexpected connections. Provide specific examples and actionable insights.`
      },
      {
        condition: () => context.recentThemes.length > 0,
        displayText: "Explore adjacent ideas",
        hiddenPrompt: `Given the themes we've covered (${context.recentThemes.join(', ')}), identify 3 adjacent fields or disciplines that approach these same challenges from completely different angles. Show me how experts in these areas would tackle the issues we've discussed.`
      },
      {
        condition: () => context.complexity === 'surface',
        displayText: "What's the bigger picture?",
        hiddenPrompt: `Take our conversation to a higher level of abstraction. What broader patterns, systems, or frameworks encompass what we've been discussing? Connect our specific points to universal principles or larger movements.`
      },
      {
        condition: () => context.conversationLength > 10,
        displayText: "Cross-pollinate insights",
        hiddenPrompt: `Combine insights from our entire conversation to generate 3 novel applications or solutions we haven't considered. Look for unexpected intersections between the different topics we've explored.`
      }
    ];

    return this.selectBestTemplate(templates, context, 'expand');
  }

  private static selectBestTemplate(templates: any[], context: ConversationContext, archetype: string): PromptOption[] {
    const validTemplates = templates.filter(t => t.condition());
    const selected = validTemplates[Math.floor(Math.random() * validTemplates.length)] || templates[0];
    
    return [{
      id: `${archetype}-${Date.now()}`,
      displayText: selected.displayText,
      hiddenPrompt: selected.hiddenPrompt,
      archetype: archetype as 'expand',
      category: 'exploration'
    }];
  }
}

/**
 * DEEPEN Archetype - Go inward, find patterns, analyze deeper
 */
export class DeepenPrompts {
  static generate(context: ConversationContext): PromptOption[] {
    const templates = [
      {
        condition: () => context.emotionalTone === 'analytical',
        displayText: "What's the pattern here?",
        hiddenPrompt: `Analyze the underlying patterns in everything we've discussed. What meta-principles are at play? What psychological, philosophical, or systemic patterns am I operating within that I might not recognize? Help me see the invisible frameworks shaping this conversation.`
      },
      {
        condition: () => context.complexity !== 'deep',
        displayText: "Dig into the foundations",
        hiddenPrompt: `Let's examine the foundational assumptions behind our discussion. What core beliefs, definitions, or premises are we taking for granted? Challenge these foundations and show me what lies beneath our current understanding.`
      },
      {
        condition: () => context.userStyle === 'exploratory' || context.userStyle === 'philosophical',
        displayText: "What am I not seeing?",
        hiddenPrompt: `Based on our conversation, identify 3 significant blind spots in my thinking or perspective. What important dimensions, stakeholders, or consequences am I overlooking? Help me recognize the gaps in my mental model.`
      },
      {
        condition: () => context.recentThemes.length > 2,
        displayText: "Connect the deeper threads",
        hiddenPrompt: `Look beyond the surface topics we've discussed. What deeper psychological needs, fears, values, or drives are really at the heart of this conversation? What's the emotional or existential core that connects all these threads?`
      }
    ];

    return this.selectBestTemplate(templates, context, 'deepen');
  }

  private static selectBestTemplate(templates: any[], context: ConversationContext, archetype: string): PromptOption[] {
    const validTemplates = templates.filter(t => t.condition());
    const selected = validTemplates[Math.floor(Math.random() * validTemplates.length)] || templates[0];
    
    return [{
      id: `${archetype}-${Date.now()}`,
      displayText: selected.displayText,
      hiddenPrompt: selected.hiddenPrompt,
      archetype: archetype as 'deepen',
      category: 'insight'
    }];
  }
}

/**
 * FLIP Archetype - Challenge perspective, find alternatives
 */
export class FlipPrompts {
  static generate(context: ConversationContext): PromptOption[] {
    const templates = [
      {
        condition: () => context.emotionalTone !== 'challenged',
        displayText: "Challenge this thinking",
        hiddenPrompt: `Take the opposite viewpoint of everything we've discussed. What are the strongest counterarguments to my position? Play devil's advocate and show me where my reasoning might be flawed or incomplete. Be intellectually rigorous but constructive.`
      },
      {
        condition: () => context.userStyle === 'direct' || context.userStyle === 'practical',
        displayText: "Flip the perspective",
        hiddenPrompt: `Completely reverse my perspective on this topic. If I'm thinking bottom-up, show me top-down. If I'm focused on problems, show me opportunities. If I'm being rational, show me the emotional dimension. Give me a 180-degree view.`
      },
      {
        condition: () => context.complexity === 'deep',
        displayText: "What if I'm wrong?",
        hiddenPrompt: `Seriously entertain the possibility that my core assumptions in this conversation are fundamentally incorrect. What would the world look like if the opposite were true? Build a compelling case for why my current thinking might be leading me astray.`
      },
      {
        condition: () => context.topics.length > 1,
        displayText: "Reframe completely",
        hiddenPrompt: `Take everything we've discussed and reframe it through a completely different lens - historical, cultural, scientific, artistic, or philosophical. Show me how someone from a radically different background or time period would approach these same questions.`
      }
    ];

    return this.selectBestTemplate(templates, context, 'flip');
  }

  private static selectBestTemplate(templates: any[], context: ConversationContext, archetype: string): PromptOption[] {
    const validTemplates = templates.filter(t => t.condition());
    const selected = validTemplates[Math.floor(Math.random() * validTemplates.length)] || templates[0];
    
    return [{
      id: `${archetype}-${Date.now()}`,
      displayText: selected.displayText,
      hiddenPrompt: selected.hiddenPrompt,
      archetype: archetype as 'flip',
      category: 'perspective'
    }];
  }
}

/**
 * Main template generator - combines all three archetypes
 */
export class PromptTemplateEngine {
  static generateOptions(context: ConversationContext): PromptOption[] {
    const expandOptions = ExpandPrompts.generate(context);
    const deepenOptions = DeepenPrompts.generate(context);
    const flipOptions = FlipPrompts.generate(context);

    return [
      ...expandOptions,
      ...deepenOptions,
      ...flipOptions
    ].slice(0, 3); // Ensure max 3 options
  }
}