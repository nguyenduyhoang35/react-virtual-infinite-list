import { useState } from 'react'
import { PagePaginationExample } from './examples/PagePagination'
import { CursorPaginationExample } from './examples/CursorPagination'
import { VirtualListExample } from './examples/VirtualList'
import { WindowScrollListExample } from './examples/WindowScrollList'
import { HookExample } from './examples/HookExample'
import { GridLayoutExample } from './examples/GridLayout'
import './App.css'

type ExampleType = 'page' | 'cursor' | 'grid' | 'virtual' | 'window' | 'hook'

function App() {
  const [activeExample, setActiveExample] = useState<ExampleType>('page')

  return (
    <div className="app">
      <header>
        <h1>React Infinite List - Examples</h1>
        <nav>
          <button
            className={activeExample === 'page' ? 'active' : ''}
            onClick={() => setActiveExample('page')}
          >
            Page
          </button>
          <button
            className={activeExample === 'cursor' ? 'active' : ''}
            onClick={() => setActiveExample('cursor')}
          >
            Cursor
          </button>
          <button
            className={activeExample === 'grid' ? 'active' : ''}
            onClick={() => setActiveExample('grid')}
          >
            Grid
          </button>
          <button
            className={activeExample === 'virtual' ? 'active' : ''}
            onClick={() => setActiveExample('virtual')}
          >
            Virtual
          </button>
          <button
            className={activeExample === 'window' ? 'active' : ''}
            onClick={() => setActiveExample('window')}
          >
            Window Scroll
          </button>
          <button
            className={activeExample === 'hook' ? 'active' : ''}
            onClick={() => setActiveExample('hook')}
          >
            Hook
          </button>
        </nav>
      </header>

      <main>
        {activeExample === 'page' && <PagePaginationExample />}
        {activeExample === 'cursor' && <CursorPaginationExample />}
        {activeExample === 'grid' && <GridLayoutExample />}
        {activeExample === 'virtual' && <VirtualListExample />}
        {activeExample === 'window' && <WindowScrollListExample />}
        {activeExample === 'hook' && <HookExample />}
      </main>
    </div>
  )
}

export default App
