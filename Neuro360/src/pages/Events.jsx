import React, { useEffect, useRef } from 'react';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';

const Events = () => {
  const events = [
    {
      id: 1,
      title: 'Limitless Smiles Workshops - All Season Pass',
      image: '/events images/Special Neuro Sessions Pass-new.jpg',
      dateInfo: 'Sat, 17 Jan | 6 sessions in 6 months.',
      tag: '6 Months Program',
      color: 'from-blue-600 to-indigo-700',
      link: 'https://www.limitlessbrainshop.com/pages/events'
    },
    {
      id: 2,
      title: 'NEURO NIRVANA ADVANCED, NEURO MEDITATION.',
      image: '/events images/Neuro Meditation Flyer.jpg',
      dateInfo: 'Sat, 21 Mar | Online Zoom event.',
      tag: '12 days remaining',
      color: 'from-purple-600 to-blue-700',
      link: 'https://www.limitlessbrainshop.com/pages/events'
    },
    {
      id: 3,
      title: 'NEURO WEALTH OVERCOME, 7 BLOCKS OF PROSPERITY.',
      image: '/events images/Neuro Wealth Flyer.jpg',
      dateInfo: 'Sat, 18 Apr | Online Zoom event.',
      tag: '40 days remaining',
      color: 'from-amber-500 to-orange-600',
      link: 'https://www.limitlessbrainshop.com/pages/events'
    },
    {
      id: 4,
      title: 'Ceremonious Cord Cutting Rituals Neuro Relationship',
      image: '/events images/Neuro Relationship Flyer.jpg',
      dateInfo: 'Sat, 25 Apr | Online LIVE on Zoom.',
      tag: '47 days remaining',
      color: 'from-rose-500 to-pink-700',
      link: 'https://www.limitlessbrainshop.com/pages/events'
    },
    {
      id: 5,
      title: "FORGIVENESS RITUAL & AMYGDALA RESET - HO'OPONOPONO DECODED",
      image: '/events images/Neuro Rituals Flyer.jpg',
      dateInfo: 'Sat, 16 May | Online Zoom event.',
      tag: '68 days remaining',
      color: 'from-teal-500 to-emerald-700',
      link: 'https://www.limitlessbrainshop.com/pages/events'
    },
    {
      id: 6,
      title: 'NEURO VEDIC PARENTING',
      image: '/events images/Neuro Vedic Flyer.jpg',
      dateInfo: 'Sat, 22 Jun | Online Zoom event.',
      tag: '105 days remaining',
      color: 'from-cyan-500 to-blue-700',
      link: 'https://www.limitlessbrainshop.com/pages/events'
    },
  ];

  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-3xl mx-auto">
      <style>{`
        .event-card {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out, box-shadow 0.3s ease;
        }
        .event-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .event-card:nth-child(2) { transition-delay: 0.08s; }
        .event-card:nth-child(3) { transition-delay: 0.16s; }
        .event-card:nth-child(4) { transition-delay: 0.24s; }
        .event-card:nth-child(5) { transition-delay: 0.32s; }
        .event-card:nth-child(6) { transition-delay: 0.40s; }
        .event-card:nth-child(7) { transition-delay: 0.48s; }
        .event-card:nth-child(8) { transition-delay: 0.56s; }
        .event-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        }
        .event-card:hover .event-image {
          transform: scale(1.05);
        }
        .event-card:hover .buy-btn {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(50,57,86,0.4);
        }
        .event-image {
          transition: transform 0.4s ease;
        }
        .buy-btn {
          transition: all 0.25s ease;
        }
      `}</style>

      {/* Title */}
      <h1 className="text-lg sm:text-3xl font-bold text-[#323956] dark:text-white text-center mb-4 sm:mb-8">
        Events
      </h1>

      {/* Event List */}
      <div className="space-y-3 sm:space-y-4">
        {events.map((event, index) => (
          <div
            key={event.id}
            ref={(el) => (cardRefs.current[index] = el)}
            className="event-card bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row shadow-sm"
          >
            {/* Image */}
            <div className="w-full sm:w-2/5 flex-shrink-0 overflow-hidden h-36 sm:h-auto">
              <img
                src={event.image}
                alt={event.title}
                className="event-image w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${event.color} flex items-center justify-center p-3"><span class="text-white text-xs font-semibold text-center">${event.title}</span></div>`;
                }}
              />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 px-3 sm:px-5 py-2.5 sm:py-4 min-w-0 justify-center">
              {/* Tag */}
              {event.tag && (
                <span className="inline-flex items-center self-start gap-1 text-[9px] sm:text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full px-2 sm:px-2.5 py-0.5 mb-1.5 sm:mb-2 font-medium">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  {event.tag}
                </span>
              )}

              {/* Title */}
              <h3 className="text-xs sm:text-base font-bold text-gray-900 dark:text-white leading-snug mb-1 sm:mb-1.5 line-clamp-2">
                {event.title}
              </h3>

              {/* Date */}
              <p className="flex items-start gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">
                <Calendar className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{event.dateInfo}</span>
              </p>

              {/* Buy Tickets Button */}
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                className="buy-btn inline-flex items-center gap-1 sm:gap-1.5 self-start bg-[#323956] hover:bg-[#4a5578] text-white text-[10px] sm:text-xs font-semibold px-3 sm:px-5 py-1.5 sm:py-2 rounded-md sm:rounded-lg"
              >
                Buy Tickets
                <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
