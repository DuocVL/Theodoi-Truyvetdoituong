
import { prisma } from '../configs/prisma';

// This is a placeholder for a more complex analytics query.
// You should customize this to fit your specific needs.
export const getCheckinCountByDay = async () => {
  return await prisma.checkin.groupBy({
    by: ['checkin_time'],
    _count: {
      checkin_time: true,
    },
  });
};
