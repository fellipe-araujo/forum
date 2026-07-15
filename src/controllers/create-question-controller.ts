import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import { Controller, Post, UseGuards } from '@nestjs/common'

@Controller('/questions')
@UseGuards(JwtAuthGuard)
export class CreateQuestionController {
  constructor() {}

  @Post()
  async handle() {
    return 'ok'
  }
}
