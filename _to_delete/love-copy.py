import re,sys
SUB_OLD='A life vault that grows with you, and opens for the people you love most when the time comes.'
SUB_NEW="Everything they'll need to find, and everything you want them to hear. Gathered as your life grows, and given to them when the time comes."
VOICE_RULE='''
### Lead with the gift, not the vault
In marketing (landing pages, ads, buttons, social), **never lead with "vault"**. It's a container, not a reason. Lead with the people and the gift: *for the people you love most*, *their gift*, *what they'll need*, *what you want them to hear*. Every line should carry both halves of afterbox: **love** (it's for them, from you) and **necessity** (they'll need it, they won't have to guess).
- "Vault" is fine inside the product and in the trust lines, where safety is the point ("Not even afterbox can open your vault").
- Buttons name the gift or the person, never the container: **Build their gift** (primary) · **Begin with someone you love** (the closing call to action, which mirrors the first step of onboarding: "Think of someone you love. Who came to mind first?").
'''
def edit(path):
    s=open(path).read(); o=s
    s=re.sub(r'\bIsla\b','Mary',s)
    s=s.replace(SUB_OLD,SUB_NEW)
    s=s.replace('- CTA: *Start your vault* (primary) · *See how it works* (secondary)','- CTA: *Build their gift* (primary) · *See how it works* (secondary) · closing: *Begin with someone you love*')
    s=s.replace('| life vault, your vault | account, profile, database |','| their gift, everything they\'ll need; "your vault" only inside the product | account, profile, database |')
    if path.endswith('design-system.md') or path.endswith('README.md'):
        if 'Lead with the gift, not the vault' not in s:
            s=s.replace('\n### The name\n', VOICE_RULE+'\n### The name\n',1)
    if path.endswith('landing-page-story.md'):
        s=s.replace('- **Primary action:** **Start your vault**. It leads into sign-up and then the vault dashboard (until the dashboard exists, it goes to a simple `/start` placeholder page).',
          '- **Primary action:** **Build their gift**. It leads into onboarding (which starts by asking who you love), sign-up and then the dashboard. Until those exist, it goes to a simple `/start` placeholder page.\n- **Language:** never lead with "vault" in this page\'s copy (see the design system, "Lead with the gift, not the vault"). Every section should carry love *and* necessity.')
        s=s.replace('· **Start your vault**.','· **Build their gift**.')
        s=s.replace('a compact **Start your vault** pill','a compact **Build their gift** pill')
        s=s.replace("- **Says:** *Start building it for them.* One button: **Start your vault**.","- **Says:** *Start building it for them.* One button: **Begin with someone you love**.")
        s=s.replace('- **Start your vault** links to `/start`','- **Build their gift** and **Begin with someone you love** link to `/start`')
    if path.endswith('CLAUDE.md'):
        s=s.replace('Its primary call to action is **Start your vault**, which leads to sign-up and then the vault dashboard (`/start` is a placeholder until those exist).',
          'Its primary call to action is **Build their gift** (the closing one is **Begin with someone you love**); both lead to onboarding, sign-up and then the dashboard (`/start` is a placeholder until those exist). **Never lead with "vault" in marketing copy**: lead with the people and the gift, and make every line carry both love and necessity (design system: "Lead with the gift, not the vault").')
    open(path,'w').write(s)
    print(path, 'changed' if s!=o else 'same')
for p in sys.argv[1:]: edit(p)
