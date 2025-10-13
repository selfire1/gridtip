import { Metadata } from 'next'
import { marked } from 'marked'

export const metadata: Metadata = {
  title: 'Rules',
}

export default function RulesPage() {
  return (
    <div className='typography'>
      <h1 className='sr-only'>Rules</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: getHtmlFromMarkdown(getContents()),
        }}
      />
    </div>
  )

  function getHtmlFromMarkdown(markdown: string) {
    return marked.parse(markdown)
  }

  function getContents() {
    const contents = `
## Scoring

### Grand Prix weekends

Each Grand Prix weekend, there are total of **five points** up for grabs.

It’s one point each for a correct tip of:

1. The driver who qualified for the **pole position**,
2. The driver who finished **first in the Grand Prix**,
3. The **tenth** place finisher (P10),
4. The **last place** (among classified finishers), and the 
5. **Constructor** that scored the **most points** in the Grand Prix. <br>In case of a tie, all tied constructors are accepted as correct answers.

### Sprint weekends

On sprint weekends, there is a bonus sixth point available for the driver who finished **first** (P1) in the Sprint Race.

### Results evaluation
Driver positions are evaluated as per the final [official results](https://www.fia.com/documents/championships/fia-formula-one-world-championship-14/season/season-2025-2071). 

Examples of what that could look like:
- Russell finishes the race first but receives a time penalty that drops him to P2 in the official results. Result: Tips for Russell as P1 are incorrect.
- Norris has a late crash. He doesn't cross the checkered flag. He is still classified in the final results as driver with the last position. Result: Tips for Norris as last are correct.

### Championships

You can score your points by correctly predicting the Constructors’ and Drivers’ Championships.

- Drivers’ Championship: 15 points  
- Constructors’ Championship: 10 points

Championship picks must be submitted before the first qualifying session of the season.


## Results

Tipping results are usually available on the **Monday after** each race weekend.
`.trim()
    return contents
  }
}
