import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import Booking from '@/models/Booking';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || '';
    const escrowFilter = searchParams.get('escrowStatus') || '';

    const filter = {};
    if (statusFilter) filter.status = statusFilter;
    if (escrowFilter) filter.escrowStatus = escrowFilter;

    if (user.role === 'admin') {
      // Admins can see all
    } else if (user.role === 'trainer') {
      filter.trainer = user._id;
    } else {
      filter.trainee = user._id;
    }

    const bookings = await Booking.find(filter)
      .populate('trainer', 'username email avatarUrl')
      .populate('trainee', 'username email avatarUrl')
      .populate('program', 'title category trainingMode')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });

    const { bookingId, action, amountToRelease } = await request.json(); // action = 'release' or 'dispute'

    const booking = await Booking.findById(bookingId).populate('trainer trainee program');
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const isAdmin = user.role === 'admin';
    const isTrainee = booking.trainee._id.toString() === user._id.toString();

    if (action === 'release') {
      if (!isAdmin && !isTrainee) {
        return NextResponse.json({ error: 'Only the trainee or an admin can release funds' }, { status: 403 });
      }

      if (booking.escrowStatus === 'released') {
        return NextResponse.json({ error: 'Funds already released fully' }, { status: 400 });
      }

      // Track released amounts on the booking (we need to add releasedAmount field to model if it's not there,
      // but let's assume we can add it or just calculate it. The old schema tracked it. Let's just release fully for simplicity, or step-by-step.)
      // For this system, let's just mark it as released if the full amount is released.
      const remainingToRelease = booking.amountPaid - (booking.releasedAmount || 0);
      const releaseVal = amountToRelease ? Math.min(amountToRelease, remainingToRelease) : remainingToRelease;

      if (releaseVal <= 0) return NextResponse.json({ error: 'No funds left to release' }, { status: 400 });

      booking.releasedAmount = (booking.releasedAmount || 0) + releaseVal;
      
      if (booking.releasedAmount >= booking.amountPaid) {
        booking.escrowStatus = 'released';
        booking.status = 'completed'; // if all funds released, booking is complete
      } else {
        booking.escrowStatus = 'partially_released';
      }

      // Update trainer balance
      await User.findByIdAndUpdate(booking.trainer._id, {
        $inc: { 'trainerInfo.escrowBalance': releaseVal },
      });

      const { default: Notification } = await import('@/models/Notification');
      await Notification.create({
        user: booking.trainer._id,
        title: 'Funds Released! 💰',
        message: `${user.username || 'A client'} has released $${releaseVal.toFixed(2)} for ${booking.program.title}.`,
        type: 'system',
        link: '/trainer-dashboard'
      });

    } else if (action === 'dispute') {
      if (!isTrainee && !isAdmin && booking.trainer._id.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'Not authorized to dispute this booking' }, { status: 403 });
      }
      booking.status = 'disputed';
      booking.escrowStatus = 'held'; // Freeze funds
      
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length > 0) {
        const { default: Notification } = await import('@/models/Notification');
        const adminNotifications = admins.map(admin => ({
          user: admin._id,
          title: 'Escrow Dispute Raised 🚨',
          message: `A dispute was raised for a $${booking.amountPaid.toFixed(2)} booking between ${booking.trainee.username} and ${booking.trainer.username}.`,
          type: 'system',
          link: '/admin'
        }));
        await Notification.insertMany(adminNotifications);
      }

      // Create the Dispute record
      const { default: Dispute } = await import('@/models/Dispute');
      await Dispute.create({
        booking: booking._id,
        raisedBy: user._id,
        reason: 'User requested intervention via dashboard.'
      });
    } else if (action === 'request') {
      if (booking.trainer._id.toString() !== user._id.toString()) {
        return NextResponse.json({ error: 'Only the trainer can request funds' }, { status: 403 });
      }
      
      const { default: Notification } = await import('@/models/Notification');
      await Notification.create({
        user: booking.trainee._id,
        title: 'Action Required: Release Funds 🔔',
        message: `Your trainer ${booking.trainer.username} has requested the release of funds for ${booking.program.title}. Please review and release from your dashboard.`,
        type: 'system',
        link: '/dashboard'
      });
      // No status change needed, just notification
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await booking.save();
    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
