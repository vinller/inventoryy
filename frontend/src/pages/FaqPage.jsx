// src/pages/FaqPage.jsx
import React from "react";
import TopBar from "../components/TopBar";

function FaqPage() {
  const faqs = [
    {
      question: "How do I check out an item?",
      answer:
        "Go to the User Dashboard and scan or enter the item's barcode. If the item is available, a checkout form will appear for you to enter the room, client name, and event number.",
    },
    {
      question: "What happens if I scan an item that's already checked out?",
      answer:
        "The system will automatically check it back in, provided you're the user who previously checked it out. A success message will confirm the check-in.",
    },
    {
      question: "Can I view my past check-ins and check-outs?",
      answer:
        "Yes. Go to the 'History' section on your dashboard to see a full log of all your activity, filtered by date, action, and other parameters.",
    },
    {
      question: "Why is my item not showing up when I scan the barcode?",
      answer:
        "It’s likely that the item hasn’t been added to the database yet or the barcode is incorrect. Contact an admin to verify the item exists.",
    },
    {
      question: "Who has access to add or delete items?",
      answer:
        "Only users with admin or dev roles can create, update, or delete items. Regular users can only check items in and out.",
    },
    {
      question: "What should I do if I accidentally check out the wrong item?",
      answer:
        "Immediately check it back in using the same barcode and notify your supervisor so they can verify the item history.",
    }
  ];

  return (
    <>
      <TopBar />
      <div className="bg-gray-900 text-white min-h-screen p-6">
        <h2 className="text-3xl font-bold text-asuGold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6 max-w-4xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-gray-800 p-5 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-2 text-asuGold">{faq.question}</h3>
              <p className="text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default FaqPage;
