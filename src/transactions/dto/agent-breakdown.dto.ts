import { IsString, IsNotEmpty } from 'class-validator';

export class AgentBreakdownDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;
}
