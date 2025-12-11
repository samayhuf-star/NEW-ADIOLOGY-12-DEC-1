import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Save, Download, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { TemplateData } from '../utils/savedWebsites';
import { Button } from './ui/button';

interface Section {
  id: string;
  type: 'hero' | 'features' | 'services' | 'testimonials' | 'team' | 'faq' | 'pricing' | 'gallery' | 'blog' | 'partners' | 'cta' | 'contact' | 'about';
  name: string;
  data: any;
}

interface VisualSectionsEditorProps {
  templateData: TemplateData;
  onUpdate: (html: string, css: string, sectionData?: Partial<TemplateData>) => void;
  onSave: () => void;
  onExport?: () => void;
}

const SECTION_TYPES = [
  { type: 'hero', name: 'Hero', icon: '🎯' },
  { type: 'features', name: 'Features', icon: '⭐' },
  { type: 'services', name: 'Services', icon: '🔧' },
  { type: 'testimonials', name: 'Testimonials', icon: '💬' },
  { type: 'cta', name: 'Call to Action', icon: '🚀' },
  { type: 'contact', name: 'Contact', icon: '📧' },
  { type: 'about', name: 'About', icon: '📖' },
  { type: 'faq', name: 'FAQ', icon: '❓' },
  { type: 'team', name: 'Team', icon: '👥' },
  { type: 'pricing', name: 'Pricing', icon: '💰' },
  { type: 'gallery', name: 'Gallery', icon: '🖼️' },
  { type: 'blog', name: 'Blog', icon: '📝' },
  { type: 'partners', name: 'Partners', icon: '🤝' },
];

function buildSectionsFromTemplate(data: TemplateData): Section[] {
  const sects: Section[] = [];
  
  if (data.hero) {
    sects.push({ id: 'hero', type: 'hero', name: 'Hero', data: data.hero });
  }
  if (data.features) {
    sects.push({ id: 'features', type: 'features', name: 'Features', data: data.features });
  }
  if (data.services) {
    sects.push({ id: 'services', type: 'services', name: 'Services', data: data.services });
  }
  if (data.testimonials) {
    sects.push({ id: 'testimonials', type: 'testimonials', name: 'Testimonials', data: data.testimonials });
  }
  if (data.aboutUs) {
    sects.push({ id: 'about', type: 'about', name: 'About', data: data.aboutUs });
  }
  if (data.cta) {
    sects.push({ id: 'cta', type: 'cta', name: 'CTA', data: data.cta });
  }
  if (data.contact || data.contactForm) {
    sects.push({ id: 'contact', type: 'contact', name: 'Contact', data: { ...data.contact, ...data.contactForm } });
  }

  return sects;
}

function sectionsToTemplateData(sections: Section[], originalData: TemplateData): Partial<TemplateData> {
  const result: Partial<TemplateData> = {
    footer: originalData.footer,
    seo: originalData.seo,
    styles: originalData.styles,
    hero_image: originalData.hero_image,
  };
  
  for (const section of sections) {
    switch (section.type) {
      case 'hero':
        result.hero = section.data;
        break;
      case 'features':
        result.features = section.data;
        break;
      case 'services':
        result.services = section.data;
        break;
      case 'testimonials':
        result.testimonials = section.data;
        break;
      case 'about':
        result.aboutUs = section.data;
        break;
      case 'cta':
        result.cta = section.data;
        break;
      case 'contact':
        result.contact = section.data;
        if (section.data.fields) {
          result.contactForm = section.data;
        }
        break;
      case 'team':
        (result as any).team = section.data;
        break;
      case 'pricing':
        (result as any).pricing = section.data;
        break;
      case 'gallery':
        (result as any).gallery = section.data;
        break;
      case 'blog':
        (result as any).blog = section.data;
        break;
      case 'partners':
        (result as any).partners = section.data;
        break;
      case 'faq':
        (result as any).faq = section.data;
        break;
    }
  }
  
  return result;
}

function EditableText({ 
  value, 
  onChange, 
  className = '',
  placeholder = 'Click to edit...',
  as: Tag = 'p'
}: { 
  value: string; 
  onChange: (value: string) => void; 
  className?: string;
  placeholder?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}) {
  const ref = useRef<HTMLElement>(null);
  
  const handleBlur = () => {
    if (ref.current) {
      const newValue = ref.current.innerText;
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded cursor-text transition-all hover:bg-blue-50/50 ${className}`}
      style={{ minHeight: '1em' }}
    >
      {value || placeholder}
    </Tag>
  );
}

function HeroSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  
  return (
    <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <EditableText
          value={data.heading || 'Welcome to Our Site'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h1"
          className="text-4xl md:text-5xl font-bold mb-4 text-white"
          placeholder="Enter your headline..."
        />
        <EditableText
          value={data.subheading || 'Your tagline goes here'}
          onChange={(subheading) => onUpdate({ ...data, subheading })}
          as="p"
          className="text-xl text-white/90 mb-8"
          placeholder="Enter your subheading..."
        />
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
          {data.ctaText || 'Get Started'}
        </button>
      </div>
    </section>
  );
}

function FeaturesSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [
    { title: 'Feature 1', description: 'Description here' },
    { title: 'Feature 2', description: 'Description here' },
    { title: 'Feature 3', description: 'Description here' },
  ];

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItems = [...items, { title: 'New Feature', description: 'Feature description' }];
    onUpdate({ ...data, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    onUpdate({ ...data, items: newItems });
  };

  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <EditableText
          value={data.heading || 'Our Features'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold text-center mb-4 text-gray-900"
          placeholder="Section heading..."
        />
        <EditableText
          value={data.subheading || ''}
          onChange={(subheading) => onUpdate({ ...data, subheading })}
          as="p"
          className="text-gray-600 text-center mb-12"
          placeholder="Optional subheading..."
        />
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item: any, index: number) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm relative group">
              <button
                onClick={() => removeItem(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <EditableText
                value={item.title}
                onChange={(title) => updateItem(index, 'title', title)}
                as="h3"
                className="font-semibold text-lg mb-2 text-gray-900"
                placeholder="Feature title..."
              />
              <EditableText
                value={item.description}
                onChange={(description) => updateItem(index, 'description', description)}
                as="p"
                className="text-gray-600"
                placeholder="Feature description..."
              />
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <button
            onClick={addItem}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" /> Add Feature
          </button>
        </div>
      </div>
    </section>
  );
}

function ServicesSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [
    { title: 'Service 1', description: 'Service description' },
    { title: 'Service 2', description: 'Service description' },
    { title: 'Service 3', description: 'Service description' },
  ];

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItems = [...items, { title: 'New Service', description: 'Service description' }];
    onUpdate({ ...data, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    onUpdate({ ...data, items: newItems });
  };

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <EditableText
          value={data.heading || 'Our Services'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold text-center mb-4 text-gray-900"
          placeholder="Section heading..."
        />
        <EditableText
          value={data.subheading || ''}
          onChange={(subheading) => onUpdate({ ...data, subheading })}
          as="p"
          className="text-gray-600 text-center mb-12"
          placeholder="Optional subheading..."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item: any, index: number) => (
            <div key={index} className="border border-gray-200 p-6 rounded-lg relative group hover:shadow-md transition-shadow">
              <button
                onClick={() => removeItem(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <EditableText
                value={item.title}
                onChange={(title) => updateItem(index, 'title', title)}
                as="h3"
                className="font-semibold text-lg mb-2 text-gray-900"
                placeholder="Service title..."
              />
              <EditableText
                value={item.description}
                onChange={(description) => updateItem(index, 'description', description)}
                as="p"
                className="text-gray-600"
                placeholder="Service description..."
              />
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <button
            onClick={addItem}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" /> Add Service
          </button>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [
    { quote: 'Great service!', author: 'John Doe' },
    { quote: 'Highly recommended!', author: 'Jane Smith' },
  ];

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItems = [...items, { quote: 'New testimonial', author: 'Customer Name' }];
    onUpdate({ ...data, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    onUpdate({ ...data, items: newItems });
  };

  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <EditableText
          value={data.heading || 'What Our Clients Say'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold text-center mb-12 text-gray-900"
          placeholder="Section heading..."
        />
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item: any, index: number) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-sm relative group">
              <button
                onClick={() => removeItem(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <EditableText
                value={`"${item.quote}"`}
                onChange={(quote) => updateItem(index, 'quote', quote.replace(/^"|"$/g, ''))}
                as="p"
                className="text-lg italic text-gray-700 mb-4"
                placeholder="Testimonial quote..."
              />
              <EditableText
                value={`- ${item.author}`}
                onChange={(author) => updateItem(index, 'author', author.replace(/^-\s*/, ''))}
                as="p"
                className="font-semibold text-gray-900"
                placeholder="Author name..."
              />
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <button
            onClick={addItem}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
        </div>
      </div>
    </section>
  );
}

function CTASection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  
  return (
    <section className="py-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <EditableText
          value={data.heading || 'Ready to Get Started?'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold mb-4 text-white"
          placeholder="CTA heading..."
        />
        <EditableText
          value={data.text || data.subheading || 'Contact us today to learn more.'}
          onChange={(text) => onUpdate({ ...data, text })}
          as="p"
          className="text-xl text-white/90 mb-8"
          placeholder="CTA description..."
        />
        <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
          {data.ctaText || 'Contact Us'}
        </button>
      </div>
    </section>
  );
}

function ContactSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-xl mx-auto">
        <EditableText
          value={data.heading || 'Contact Us'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold text-center mb-8 text-gray-900"
          placeholder="Section heading..."
        />
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Your Name" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input 
            type="email" 
            placeholder="Your Email" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <textarea 
            placeholder="Your Message" 
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Send Message
          </button>
        </div>
      </div>
    </section>
  );
}

function AboutSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  
  return (
    <section className="py-16 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto text-center">
        <EditableText
          value={data.heading || 'About Us'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold mb-6 text-gray-900"
          placeholder="Section heading..."
        />
        <EditableText
          value={data.description || data.text || 'We are dedicated to providing the best service to our customers.'}
          onChange={(description) => onUpdate({ ...data, description })}
          as="p"
          className="text-lg text-gray-600 leading-relaxed"
          placeholder="About description..."
        />
      </div>
    </section>
  );
}

function FAQSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  const items = data.items || [
    { question: 'How does it work?', answer: 'It works seamlessly with your existing setup.' },
    { question: 'What is the pricing?', answer: 'Contact us for a personalized quote.' },
  ];

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItems = [...items, { question: 'New Question?', answer: 'Answer here.' }];
    onUpdate({ ...data, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_: any, i: number) => i !== index);
    onUpdate({ ...data, items: newItems });
  };

  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <EditableText
          value={data.heading || 'Frequently Asked Questions'}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold text-center mb-12 text-gray-900"
          placeholder="Section heading..."
        />
        <div className="space-y-4">
          {items.map((item: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 relative group">
              <button
                onClick={() => removeItem(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <EditableText
                value={item.question}
                onChange={(question) => updateItem(index, 'question', question)}
                as="h3"
                className="font-semibold text-gray-900 mb-2"
                placeholder="Question..."
              />
              <EditableText
                value={item.answer}
                onChange={(answer) => updateItem(index, 'answer', answer)}
                as="p"
                className="text-gray-600"
                placeholder="Answer..."
              />
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <button
            onClick={addItem}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
      </div>
    </section>
  );
}

function GenericSection({ section, onUpdate }: { section: Section; onUpdate: (data: any) => void }) {
  const data = section.data;
  
  return (
    <section className="py-16 px-6 bg-gray-100">
      <div className="max-w-4xl mx-auto text-center">
        <EditableText
          value={data.heading || section.name}
          onChange={(heading) => onUpdate({ ...data, heading })}
          as="h2"
          className="text-3xl font-bold mb-4 text-gray-900"
          placeholder="Section heading..."
        />
        <EditableText
          value={data.description || data.text || 'Section content goes here.'}
          onChange={(description) => onUpdate({ ...data, description })}
          as="p"
          className="text-gray-600"
          placeholder="Section content..."
        />
      </div>
    </section>
  );
}

export default function VisualSectionsEditor({ templateData, onUpdate, onSave, onExport }: VisualSectionsEditorProps) {
  const [sections, setSections] = useState<Section[]>(buildSectionsFromTemplate(templateData));
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const generateHtml = useCallback((sects: Section[]): string => {
    return sects.map(s => generateSectionHtml(s)).join('\n');
  }, []);

  const generateCss = (): string => {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    `;
  };

  useEffect(() => {
    const html = generateHtml(sections);
    const sectionData = sectionsToTemplateData(sections, templateData);
    onUpdate(html, generateCss(), sectionData);
  }, [sections, generateHtml, onUpdate, templateData]);

  const updateSection = (id: string, data: any) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, data } : s));
  };

  const addSection = (type: string) => {
    const typeInfo = SECTION_TYPES.find(s => s.type === type);
    const newSection: Section = {
      id: `${type}-${Date.now()}`,
      type: type as any,
      name: typeInfo?.name || type,
      data: {}
    };
    setSections([...sections, newSection]);
    setShowAddMenu(false);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    if (selectedSection === id) {
      setSelectedSection(null);
    }
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (direction === 'up' && index > 0) {
      const newSections = [...sections];
      [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
      setSections(newSections);
    } else if (direction === 'down' && index < sections.length - 1) {
      const newSections = [...sections];
      [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
      setSections(newSections);
    }
  };

  const renderSection = (section: Section) => {
    const sectionProps = {
      section,
      onUpdate: (data: any) => updateSection(section.id, data),
    };

    switch (section.type) {
      case 'hero': return <HeroSection {...sectionProps} />;
      case 'features': return <FeaturesSection {...sectionProps} />;
      case 'services': return <ServicesSection {...sectionProps} />;
      case 'testimonials': return <TestimonialsSection {...sectionProps} />;
      case 'cta': return <CTASection {...sectionProps} />;
      case 'contact': return <ContactSection {...sectionProps} />;
      case 'about': return <AboutSection {...sectionProps} />;
      case 'faq': return <FAQSection {...sectionProps} />;
      default: return <GenericSection {...sectionProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-gray-900">Visual Editor</h1>
            <span className="text-sm text-gray-500">{sections.length} sections</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowAddMenu(!showAddMenu)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
            <Button onClick={onSave} className="gap-2 bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4" />
              Save
            </Button>
            {onExport && (
              <Button onClick={onExport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            )}
          </div>
        </div>
        
        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 bg-white border-b shadow-lg">
            <div className="max-w-7xl mx-auto p-4">
              <p className="text-sm text-gray-500 mb-3">Choose a section to add:</p>
              <div className="flex flex-wrap gap-2">
                {SECTION_TYPES.map(type => (
                  <button
                    key={type.type}
                    onClick={() => addSection(type.type)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span>{type.icon}</span>
                    <span className="text-sm font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pb-20">
        {sections.length === 0 ? (
          <div className="max-w-2xl mx-auto py-20 text-center">
            <div className="bg-white rounded-xl p-12 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No sections yet</h2>
              <p className="text-gray-500 mb-6">Click "Add Section" to start building your page</p>
              <Button onClick={() => setShowAddMenu(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Section
              </Button>
            </div>
          </div>
        ) : (
          sections.map((section, index) => (
            <div
              key={section.id}
              className={`relative group ${selectedSection === section.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedSection(section.id)}
            >
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white rounded-lg shadow-lg p-1 flex flex-col gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }}
                    disabled={index === sections.length - 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="border-t my-1" />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                    className="p-1 hover:bg-red-50 text-red-600 rounded"
                    title="Delete section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {SECTION_TYPES.find(t => t.type === section.type)?.icon} {section.name}
                </span>
              </div>

              {renderSection(section)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function generateSectionHtml(section: Section): string {
  const data = section.data;
  
  switch (section.type) {
    case 'hero':
      return `<section class="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20 px-6">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-4xl md:text-5xl font-bold mb-4">${data.heading || 'Welcome to Our Site'}</h1>
    <p class="text-xl opacity-90 mb-8">${data.subheading || 'Your tagline goes here'}</p>
    <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50">${data.ctaText || 'Get Started'}</button>
  </div>
</section>`;

    case 'features':
      const features = data.items || [{ title: 'Feature', description: 'Description' }];
      return `<section class="py-16 px-6 bg-gray-50">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-center mb-4">${data.heading || 'Our Features'}</h2>
    ${data.subheading ? `<p class="text-gray-600 text-center mb-12">${data.subheading}</p>` : ''}
    <div class="grid md:grid-cols-3 gap-8">
      ${features.map((f: any) => `<div class="bg-white p-6 rounded-xl shadow-sm">
        <h3 class="font-semibold text-lg mb-2">${f.title}</h3>
        <p class="text-gray-600">${f.description}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

    case 'services':
      const services = data.items || [{ title: 'Service', description: 'Description' }];
      return `<section class="py-16 px-6 bg-white">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-center mb-4">${data.heading || 'Our Services'}</h2>
    ${data.subheading ? `<p class="text-gray-600 text-center mb-12">${data.subheading}</p>` : ''}
    <div class="grid md:grid-cols-3 gap-6">
      ${services.map((s: any) => `<div class="border border-gray-200 p-6 rounded-lg">
        <h3 class="font-semibold text-lg mb-2">${s.title}</h3>
        <p class="text-gray-600">${s.description}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

    case 'testimonials':
      const testimonials = data.items || [{ quote: 'Great!', author: 'Customer' }];
      return `<section class="py-16 px-6 bg-gray-50">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-3xl font-bold text-center mb-12">${data.heading || 'What Our Clients Say'}</h2>
    <div class="grid md:grid-cols-2 gap-8">
      ${testimonials.map((t: any) => `<div class="bg-white p-8 rounded-xl shadow-sm">
        <p class="text-lg italic text-gray-700 mb-4">"${t.quote}"</p>
        <p class="font-semibold">- ${t.author}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

    case 'cta':
      return `<section class="py-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl font-bold mb-4">${data.heading || 'Ready to Get Started?'}</h2>
    <p class="text-xl opacity-90 mb-8">${data.text || data.subheading || 'Contact us today.'}</p>
    <button class="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold">${data.ctaText || 'Contact Us'}</button>
  </div>
</section>`;

    case 'contact':
      return `<section class="py-16 px-6 bg-white">
  <div class="max-w-xl mx-auto">
    <h2 class="text-3xl font-bold text-center mb-8">${data.heading || 'Contact Us'}</h2>
    <form class="space-y-4">
      <input type="text" placeholder="Your Name" class="w-full px-4 py-3 border rounded-lg">
      <input type="email" placeholder="Your Email" class="w-full px-4 py-3 border rounded-lg">
      <textarea placeholder="Your Message" rows="4" class="w-full px-4 py-3 border rounded-lg"></textarea>
      <button class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold">Send Message</button>
    </form>
  </div>
</section>`;

    case 'about':
      return `<section class="py-16 px-6 bg-gray-50">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl font-bold mb-6">${data.heading || 'About Us'}</h2>
    <p class="text-lg text-gray-600 leading-relaxed">${data.description || data.text || 'We are dedicated to providing the best service.'}</p>
  </div>
</section>`;

    case 'faq':
      const faqs = data.items || [{ question: 'Question?', answer: 'Answer.' }];
      return `<section class="py-16 px-6 bg-white">
  <div class="max-w-3xl mx-auto">
    <h2 class="text-3xl font-bold text-center mb-12">${data.heading || 'FAQ'}</h2>
    <div class="space-y-4">
      ${faqs.map((f: any) => `<div class="border rounded-lg p-6">
        <h3 class="font-semibold mb-2">${f.question}</h3>
        <p class="text-gray-600">${f.answer}</p>
      </div>`).join('')}
    </div>
  </div>
</section>`;

    default:
      return `<section class="py-16 px-6 bg-gray-100">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-3xl font-bold mb-4">${data.heading || section.name}</h2>
    <p class="text-gray-600">${data.description || 'Section content'}</p>
  </div>
</section>`;
  }
}
