type TaskFunction = () => Promise<void>

export class Queue {
  private tasks: TaskFunction[]
  private concurrency: number
  private running: number

  constructor(concurrency: number) {
    this.tasks = []
    this.concurrency = concurrency
    this.running = 0
  }

  enqueue(task: TaskFunction): void {
    this.tasks.push(task)
    this.next()
  }

  private next(): void {
    while (this.running < this.concurrency && this.tasks.length) {
      const task = this.tasks.shift()
      if (task) {
        this.running++
        task().finally(() => {
          this.running--
          this.next()
        })
      }
    }
  }
}
