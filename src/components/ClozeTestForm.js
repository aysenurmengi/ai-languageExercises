import React, { useState } from 'react';
import './ClozeTestForm.css';

const ClozeTestForm = ({ onGenerate, disabled }) => {
  const [formData, setFormData] = useState({
    title: '',
    numberOfQuestions: '',
    level: '',
    ageGroup: '',
    grammarTopic: '',
    grammarSubcategory: '',
    usageOptions: [],
    context: '',
    additionalRules: '',
    autoGenerate: false
  });

  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  const grammarTopics = {
    FUTURE: {
      subcategories: {
        'future continuous': {
          usage: [
            'USE: future arrangements',
            'FORM: affirmative with "will"',
            'FORM: negative with "will not/won\'t"',
            'FORM: questions with "will"'
          ]
        },
        'future with will and shall': {
          usage: [
            'USE: offers with "shall"',
            'USE: requests with "will"',
            'USE: suggestions with "shall"',
            'FORM: affirmative with "will/shall"',
            'FORM: negative with "will not/won\'t"'
          ]
        },
        'future with be going to': {
          usage: [
            'USE: planned future actions',
            'USE: predictions based on evidence',
            'FORM: affirmative with "be going to"',
            'FORM: negative with "be not going to"'
          ]
        },
        'present continuous for future use': {
          usage: [
            'USE: fixed arrangements',
            'USE: planned future events',
            'FORM: present continuous tense',
            'FORM: time expressions for future'
          ]
        }
      }
    },
    PAST: {
      subcategories: {
        'past simple': {
          usage: [
            'USE: completed actions in the past',
            'USE: habits in the past',
            'USE: series of actions in the past',
            'FORM: regular verbs with -ed',
            'FORM: irregular verbs',
            'FORM: negative with did not/didn\'t',
            'FORM: questions with did'
          ]
        },
        'past continuous': {
          usage: [
            'USE: actions in progress in the past',
            'USE: background actions',
            'USE: interrupted actions',
            'FORM: was/were + verb-ing',
            'FORM: negative with was/were not',
            'FORM: questions with was/were'
          ]
        },
        'past perfect': {
          usage: [
            'USE: actions before a point in the past',
            'USE: reported speech',
            'USE: third conditional',
            'FORM: had + past participle',
            'FORM: negative with had not/hadn\'t',
            'FORM: questions with had'
          ]
        },
        'past perfect continuous': {
          usage: [
            'USE: ongoing actions before a point in the past',
            'USE: duration before a past action',
            'USE: cause and effect in the past',
            'FORM: had been + verb-ing',
            'FORM: negative with had not been',
            'FORM: questions with had been'
          ]
        },
        'used to and would': {
          usage: [
            'USE: past habits with used to',
            'USE: past states with used to',
            'USE: repeated actions with would',
            'FORM: used to + infinitive',
            'FORM: would + infinitive',
            'FORM: negative with didn\'t use to/wouldn\'t',
            'FORM: questions with did...use to/would'
          ]
        }
      }
    },
    PRESENT: {
      subcategories: {
        'present simple': {
          usage: [
            'USE: habits and routines',
            'USE: permanent situations',
            'USE: general truths',
            'USE: timetables and schedules',
            'FORM: base form of verb',
            'FORM: third person singular with -s/-es',
            'FORM: negative with do not/does not',
            'FORM: questions with do/does'
          ]
        },
        'present continuous': {
          usage: [
            'USE: actions happening now',
            'USE: temporary situations',
            'USE: changing situations',
            'USE: future arrangements',
            'FORM: be (am/is/are) + verb-ing',
            'FORM: negative with be not',
            'FORM: questions with be'
          ]
        },
        'present perfect': {
          usage: [
            'USE: past experiences',
            'USE: recent events with results',
            'USE: unfinished time periods',
            'USE: with ever/never/just/already/yet',
            'FORM: have/has + past participle',
            'FORM: negative with have not/has not',
            'FORM: questions with have/has'
          ]
        },
        'present perfect continuous': {
          usage: [
            'USE: ongoing situations',
            'USE: recent continuous activities',
            'USE: with time expressions (for/since)',
            'FORM: have/has been + verb-ing',
            'FORM: negative with have/has not been',
            'FORM: questions with have/has been'
          ]
        }
      }
    },
    ADJECTIVES: {
      subcategories: {
        'comparative adjectives': {
          usage: [
            'USE: comparing two things',
            'USE: expressing differences',
            'FORM: short adjectives with -er',
            'FORM: long adjectives with more',
            'FORM: irregular comparatives',
            'FORM: than in comparisons'
          ]
        },
        'superlative adjectives': {
          usage: [
            'USE: comparing more than two things',
            'USE: expressing extremes',
            'FORM: short adjectives with -est',
            'FORM: long adjectives with most',
            'FORM: irregular superlatives',
            'FORM: the + superlative'
          ]
        },
        'order of adjectives': {
          usage: [
            'USE: multiple adjectives before nouns',
            'FORM: opinion adjectives first',
            'FORM: size before color',
            'FORM: proper order sequence',
            'FORM: with commas and and'
          ]
        }
      }
    },
    CLAUSES: {
      subcategories: {
        'relative clauses': {
          usage: [
            'USE: defining relative clauses',
            'USE: non-defining relative clauses',
            'FORM: who for people',
            'FORM: which for things',
            'FORM: where for places',
            'FORM: whose for possession',
            'FORM: that as substitute'
          ]
        },
        'conditional clauses': {
          usage: [
            'USE: zero conditional (general truths)',
            'USE: first conditional (possible future)',
            'USE: second conditional (hypothetical)',
            'USE: third conditional (past impossible)',
            'FORM: if + present/past/past perfect',
            'FORM: main clause structures'
          ]
        }
      }
    },
    DETERMINERS: {
      subcategories: {
        'articles': {
          usage: [
            'USE: definite article (the)',
            'USE: indefinite articles (a/an)',
            'USE: zero article',
            'FORM: with countable nouns',
            'FORM: with uncountable nouns',
            'FORM: with specific references'
          ]
        },
        'quantifiers': {
          usage: [
            'USE: much/many',
            'USE: some/any',
            'USE: few/little',
            'USE: a lot of/lots of',
            'FORM: with countable nouns',
            'FORM: with uncountable nouns'
          ]
        }
      }
    },
    NOUNS: {
      subcategories: {
        'countable nouns': {
          usage: [
            'USE: singular and plural forms',
            'USE: with articles',
            'FORM: regular plurals with -s/-es',
            'FORM: irregular plurals',
            'FORM: with numbers'
          ]
        },
        'uncountable nouns': {
          usage: [
            'USE: with quantifiers',
            'USE: with articles',
            'FORM: no plural form',
            'FORM: with much/little'
          ]
        },
        'compound nouns': {
          usage: [
            'USE: noun + noun combinations',
            'USE: adjective + noun',
            'FORM: single word compounds',
            'FORM: hyphenated compounds',
            'FORM: separate word compounds'
          ]
        }
      }
    },
    PASSIVES: {
      subcategories: {
        'present passive': {
          usage: [
            'USE: current states and facts',
            'USE: regular actions',
            'FORM: am/is/are + past participle',
            'FORM: negative forms',
            'FORM: questions'
          ]
        },
        'past passive': {
          usage: [
            'USE: completed actions',
            'USE: historical events',
            'FORM: was/were + past participle',
            'FORM: negative forms',
            'FORM: questions'
          ]
        },
        'perfect passive': {
          usage: [
            'USE: completed actions with present relevance',
            'USE: past actions before others',
            'FORM: have/has/had been + past participle',
            'FORM: negative forms',
            'FORM: questions'
          ]
        }
      }
    },
    PRONOUNS: {
      subcategories: {
        'personal pronouns': {
          usage: [
            'USE: subject pronouns',
            'USE: object pronouns',
            'FORM: I/you/he/she/it/we/they',
            'FORM: me/you/him/her/it/us/them'
          ]
        },
        'possessive pronouns': {
          usage: [
            'USE: showing possession',
            'USE: replacing possessive adj + noun',
            'FORM: mine/yours/his/hers/its/ours/theirs'
          ]
        },
        'reflexive pronouns': {
          usage: [
            'USE: referring back to subject',
            'USE: emphasizing the subject',
            'FORM: myself/yourself/himself/herself/itself/ourselves/yourselves/themselves'
          ]
        }
      }
    },
    MODALITY: {
      subcategories: {
        'ability and permission': {
          usage: [
            'USE: can/could for ability',
            'USE: may/might for permission',
            'FORM: modal + base verb',
            'FORM: negative forms',
            'FORM: questions'
          ]
        },
        'obligation and necessity': {
          usage: [
            'USE: must/have to for obligation',
            'USE: need to/should for necessity',
            'FORM: modal + base verb',
            'FORM: negative forms',
            'FORM: questions'
          ]
        },
        'possibility and probability': {
          usage: [
            'USE: may/might for possibility',
            'USE: must/can\'t for deduction',
            'FORM: modal + base verb',
            'FORM: modal + be + -ing',
            'FORM: modal + have + past participle'
          ]
        }
      }
    },
    'REPORTED SPEECH': {
      subcategories: {
        'statements': {
          usage: [
            'USE: reporting present statements',
            'USE: reporting past statements',
            'FORM: tense changes',
            'FORM: pronoun changes',
            'FORM: time expression changes'
          ]
        },
        'questions': {
          usage: [
            'USE: reporting yes/no questions',
            'USE: reporting wh-questions',
            'FORM: if/whether for yes/no questions',
            'FORM: question word order changes',
            'FORM: tense backshift'
          ]
        },
        'commands': {
          usage: [
            'USE: reporting orders',
            'USE: reporting requests',
            'FORM: tell + object + infinitive',
            'FORM: ask + object + infinitive',
            'FORM: negative commands'
          ]
        }
      }
    },
    VERBS: {
      subcategories: {
        'regular verbs': {
          usage: [
            'USE: past simple forms',
            'USE: past participle forms',
            'FORM: -ed endings',
            'FORM: spelling rules',
            'FORM: pronunciation of -ed'
          ]
        },
        'irregular verbs': {
          usage: [
            'USE: common irregular verbs',
            'USE: past simple forms',
            'USE: past participle forms',
            'FORM: pattern groups',
            'FORM: completely irregular forms'
          ]
        },
        'phrasal verbs': {
          usage: [
            'USE: separable phrasal verbs',
            'USE: inseparable phrasal verbs',
            'FORM: verb + particle',
            'FORM: verb + particle + object',
            'FORM: verb + object + particle'
          ]
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Grammar topic değiştiğinde subcategory ve usage'ı sıfırla
      if (name === 'grammarTopic') {
        newData.grammarSubcategory = '';
        newData.usageOptions = [];
      }
      
      // Subcategory değiştiğinde usage'ı sıfırla
      if (name === 'grammarSubcategory') {
        newData.usageOptions = [];
      }
      
      return newData;
    });
  };

  const handleUsageChange = (option) => {
    setFormData(prev => ({
      ...prev,
      usageOptions: prev.usageOptions.includes(option)
        ? prev.usageOptions.filter(item => item !== option)
        : [...prev.usageOptions, option]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="cloze-test-form">
      <h2>Create Cloze Test</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            placeholder="Give this activity a title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Number of Questions *</label>
          <input
            type="number"
            name="numberOfQuestions"
            placeholder="Enter a number between 1-20"
            value={formData.numberOfQuestions}
            onChange={handleChange}
            min="1"
            max="20"
            required
          />
        </div>

        <div className="form-group">
          <label>Level *</label>
          <select 
            name="level" 
            value={formData.level}
            onChange={handleChange}
            required
          >
            <option value="">Select level</option>
            {levels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Grammar Topic *</label>
          <select
            name="grammarTopic"
            value={formData.grammarTopic}
            onChange={handleChange}
            required
          >
            <option value="">Select grammar topic</option>
            {Object.keys(grammarTopics).map(topic => (
              <option key={topic} value={topic}>
                {topic.charAt(0) + topic.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {formData.grammarTopic && (
          <div className="form-group">
            <label>Grammar Topic Subcategory *</label>
            <select
              name="grammarSubcategory"
              value={formData.grammarSubcategory}
              onChange={handleChange}
              required
            >
              <option value="">Select subcategory</option>
              {Object.keys(grammarTopics[formData.grammarTopic].subcategories).map(sub => (
                <option key={sub} value={sub}>
                  {sub.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>
        )}

        {formData.grammarSubcategory && (
          <div className="form-group">
            <label>Usage</label>
            <div className="usage-options">
              {grammarTopics[formData.grammarTopic].subcategories[formData.grammarSubcategory].usage.map(option => (
                <label key={option} className="usage-option">
                  <input
                    type="checkbox"
                    checked={formData.usageOptions.includes(option)}
                    onChange={() => handleUsageChange(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Context</label>
          <textarea
            name="context"
            placeholder="Write context of the activity: Business English, General English, Medical English, History, Science etc."
            value={formData.context}
            onChange={handleChange}
          />
        </div>

        <div className="form-group checkbox-single">
          <label>
            <input
              type="checkbox"
              name="autoGenerate"
              checked={formData.autoGenerate}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  autoGenerate: e.target.checked,
                  additionalRules: e.target.checked ? '' : prev.additionalRules
                }));
              }}
            />
            Auto Generate
          </label>
        </div>

        {!formData.autoGenerate && (
          <div className="form-group">
            <label>Additional Rules *</label>
            <textarea
              name="additionalRules"
              placeholder="Please provide specific rules or requirements for the cloze test"
              value={formData.additionalRules}
              onChange={handleChange}
              required
              disabled={formData.autoGenerate}
            />
            {!formData.additionalRules && !formData.autoGenerate && (
              <span className="error-message">Please provide additional rules when not using Auto Generate</span>
            )}
          </div>
        )}

        <button 
          type="submit" 
          className="generate-btn"
          disabled={disabled}
        >
          {disabled ? 'Generating...' : 'Generate'}
        </button>
      </form>
    </div>
  );
};

export default ClozeTestForm; 