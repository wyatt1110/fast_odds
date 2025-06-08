'use client';

import React, { useState } from 'react';
import { MessageSquare, FileText, LifeBuoy, ChevronDown, ChevronUp, Send, Info } from 'lucide-react';
import { useTheme } from '@/components/providers';

// FAQ Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  
  // Theme helper functions
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getIconColor = () => theme === 'dark' ? 'text-gray-500' : theme === 'racing' ? 'text-gray-400' : 'text-gray-500';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  
  return (
    <div className={`border-b ${getBorderColor()} py-4`}>
      <button
        className="flex w-full justify-between items-center text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className={`text-sm font-medium ${getTextColor()}`}>{question}</h3>
        {isOpen ? (
          <ChevronUp className={`h-5 w-5 ${getIconColor()}`} />
        ) : (
          <ChevronDown className={`h-5 w-5 ${getIconColor()}`} />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-2 text-sm">
          <p className={getMutedTextColor()}>{answer}</p>
        </div>
      )}
    </div>
  );
};

export default function HelpSupportPage() {
  // Sample FAQ data
  const faqs = [
    {
      question: "How do I add a new bet?",
      answer: "You can add a new bet by clicking the '+ Add New Bet' button on the dashboard page. Fill in the required information in the form and click Save."
    },
    {
      question: "How is the ROI calculated?",
      answer: "Return on Investment (ROI) is calculated by dividing your total profit or loss by your total stake and multiplying by 100 to get a percentage."
    },
    {
      question: "Can I edit a bet after it's been created?",
      answer: "Yes, you can edit a bet by clicking on it in the All Bets or Pending Bets page and making your changes in the edit form."
    },
    {
      question: "How do I mark a bet as won or lost?",
      answer: "On the Pending Bets page, you can update the status of a bet by selecting it and choosing the appropriate status from the dropdown menu."
    },
    {
      question: "What's the difference between ROI and win rate?",
      answer: "Win rate is the percentage of bets that resulted in a win. ROI measures your financial return as a percentage of your total investment, taking into account your winning and losing bets."
    }
  ];

  const { theme } = useTheme();
  
  // Theme helper functions
  const getCardBg = () => theme === 'dark' ? 'bg-gray-800' : theme === 'racing' ? 'bg-charcoal-800' : 'bg-white';
  const getHeaderBg = () => theme === 'dark' ? 'bg-gray-900' : theme === 'racing' ? 'bg-charcoal-900' : 'bg-slate-100';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getLinkColor = () => theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : theme === 'racing' ? 'text-racing-400 hover:text-racing-300' : 'text-blue-600 hover:text-blue-800';
  const getAlertBg = () => theme === 'dark' ? 'bg-blue-900 text-blue-200' : theme === 'racing' ? 'bg-charcoal-700 text-gray-200' : 'bg-blue-50 text-blue-700';
  const getInputBg = () => theme === 'dark' ? 'bg-gray-700 border-gray-600' : theme === 'racing' ? 'bg-charcoal-700 border-charcoal-600' : 'bg-white border-gray-300';
  const getInputTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-700';
  const getButtonBg = () => theme === 'racing' ? 'bg-racing-600 hover:bg-racing-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white';
  
  // Special title styling for dark mode with animation
  const getTitleStyle = () => {
    if (theme === 'dark') {
      return 'text-blue-400 font-extrabold text-3xl tracking-wide animate-pulse shadow-text-blue';
    } else if (theme === 'racing') {
      return 'text-racing-400 font-bold text-2xl';
    } else {
      return 'text-gray-900 font-bold text-2xl';
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className={getTitleStyle()}>Help & Support</h1>
        <p className={`mt-1 text-sm ${getMutedTextColor()}`}>Find answers to common questions or contact our support team</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Support options */}
        <div className="md:col-span-1">
          <div className="space-y-4">
            <div className={`${getCardBg()} shadow rounded-lg p-6 border ${getBorderColor()}`}>
              <h2 className={`text-lg font-medium ${getTextColor()} mb-4`}>Support Options</h2>
              
              <ul className="space-y-3">
                <li>
                  <a href="#" className={`flex items-center ${getLinkColor()}`}>
                    <MessageSquare className="h-5 w-5 mr-2" />
                    <span>Contact Support</span>
                  </a>
                </li>
                <li>
                  <a href="#" className={`flex items-center ${getLinkColor()}`}>
                    <FileText className="h-5 w-5 mr-2" />
                    <span>Documentation</span>
                  </a>
                </li>
                <li>
                  <a href="#" className={`flex items-center ${getLinkColor()}`}>
                    <LifeBuoy className="h-5 w-5 mr-2" />
                    <span>Tutorial Videos</span>
                  </a>
                </li>
              </ul>
            </div>
            
            <div className={`${getAlertBg()} rounded-lg p-6`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Need Help?</h3>
                  <div className="mt-2 text-sm">
                    <p>Our support team is available from Monday to Friday, 9 AM to 5 PM (GMT).</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - FAQ and contact form */}
        <div className="md:col-span-2">
          <div className={`${getCardBg()} shadow rounded-lg overflow-hidden border ${getBorderColor()}`}>
            <div className={`px-4 py-5 sm:px-6 ${getHeaderBg()} border-b ${getBorderColor()}`}>
              <h2 className={`text-lg font-medium ${getTextColor()}`}>Frequently Asked Questions</h2>
              <p className={`mt-1 text-sm ${getMutedTextColor()}`}>Answers to the most common questions</p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-1">
                {faqs.map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
          
          <div className={`mt-6 ${getCardBg()} shadow rounded-lg overflow-hidden border ${getBorderColor()}`}>
            <div className={`px-4 py-5 sm:px-6 ${getHeaderBg()} border-b ${getBorderColor()}`}>
              <h2 className={`text-lg font-medium ${getTextColor()}`}>Contact Us</h2>
              <p className={`mt-1 text-sm ${getMutedTextColor()}`}>Send us a message and we'll get back to you</p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <form className="space-y-4">
                <div>
                  <label htmlFor="subject" className={`block text-sm font-medium ${getTextColor()}`}>Subject</label>
                  <select
                    id="subject"
                    name="subject"
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base ${getBorderColor()} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${getInputBg()} ${getInputTextColor()}`}
                  >
                    <option>General Inquiry</option>
                    <option>Account Issue</option>
                    <option>Bug Report</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className={`block text-sm font-medium ${getTextColor()}`}>Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className={`mt-1 block w-full rounded-md ${getBorderColor()} shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${getInputBg()} ${getInputTextColor()}`}
                    placeholder="Describe your issue or question..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${getButtonBg()} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 