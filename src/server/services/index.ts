import 'server-only';

import { userRepository } from '@/server/repositories/prisma/user.repository';
import { organizationRepository } from '@/server/repositories/prisma/organization.repository';
import { auditRepository } from '@/server/repositories/prisma/audit.repository';
import { windsorConnectionRepository } from '@/server/repositories/prisma/windsor-connection.repository';
import { campaignRepository } from '@/server/repositories/prisma/campaign.repository';
import { AuthService } from '@/server/services/auth.service';
import { WindsorService } from '@/server/services/windsor.service';

export const authService = new AuthService(
  userRepository,
  organizationRepository,
  auditRepository,
);

export const windsorService = new WindsorService(
  windsorConnectionRepository,
  campaignRepository,
  auditRepository,
);
