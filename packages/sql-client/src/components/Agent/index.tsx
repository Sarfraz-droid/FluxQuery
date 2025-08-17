import { Button } from '../ui/button'
import { useAgentMode } from './useAgentMode'
import { TypewriterText } from './TypewriterText'

export const AgentMode = () => {
    const { userInput, setUserInput, handleSend, isRunning, messages } = useAgentMode();

  return (
      <div className='font-mono h-full flex flex-col'>
          <div className='flex-1 flex flex-col gap-3'>
              {messages?.map((message, index) => (
                  <div key={index} className='flex flex-col'>
                      <TypewriterText className='text-xs' text={message} speedMsPerChar={10} startDelayMs={200} />
                  </div>
              ))}
          </div>
          <div className='flex-none'>
              <div className='h-[150px] w-full bg-gray-900 rounded-sm flex flex-col p-2 gap-2 border-gray-800 border-2'>
                  <textarea className='w-full resize-none flex-1 focus:outline-none text-xs' placeholder='Ask the agent a question...' value={userInput} onChange={(e) => setUserInput(e.target.value)} />
                  <div className='w-full flex gap-2 justify-end'>
                      <Button
                        size='xs'
                        className='my-0 py-0 font-mono'
                        onClick={() => {
                            handleSend();
                        }}
                        disabled={isRunning}
                      >
                          <span>{isRunning ? "Running..." : "Send"} </span>
                      </Button>
                  </div>
              </div>
          </div>
      </div>
  )
}
